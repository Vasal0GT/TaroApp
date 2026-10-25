using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SongTranscriber;

internal static class Program
{
    private static async Task Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("Usage: SongTranscriber <audio-file> <output-file>");
            Environment.ExitCode = 1;
            return;
        }

        var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Set OPENAI_API_KEY before running the utility.");
        }

        await OpenAiTranscriber.TranscribeToFileAsync(apiKey, args[0], args[1]);
    }
}

public static class OpenAiTranscriber
{
    private const long MaxFileSizeBytes = 25L * 1024 * 1024;
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(10) };

    public static async Task<string> TranscribeToFileAsync(
        string apiKey,
        string audioFilePath,
        string outputTextFilePath,
        string? language = null,
        string? prompt = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ArgumentException("API key is empty.", nameof(apiKey));

        if (!File.Exists(audioFilePath))
            throw new FileNotFoundException("Audio file was not found.", audioFilePath);

        var fileInfo = new FileInfo(audioFilePath);
        if (fileInfo.Length == 0)
            throw new InvalidOperationException("The audio file is empty.");
        if (fileInfo.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("The audio file exceeds the 25 MB API limit.");

        using var form = new MultipartFormDataContent();
        await using var fileStream = File.OpenRead(audioFilePath);
        using var fileContent = new StreamContent(fileStream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetMimeType(audioFilePath));
        form.Add(fileContent, "file", Path.GetFileName(audioFilePath));
        form.Add(new StringContent("gpt-4o-transcribe"), "model");
        form.Add(new StringContent("json"), "response_format");

        if (!string.IsNullOrWhiteSpace(language))
            form.Add(new StringContent(language.Trim()), "language");
        if (!string.IsNullOrWhiteSpace(prompt))
            form.Add(new StringContent(prompt.Trim()), "prompt");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/audio/transcriptions")
        {
            Content = form
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await Http.SendAsync(request, HttpCompletionOption.ResponseContentRead, cancellationToken);
        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenAI API error {(int)response.StatusCode} {response.ReasonPhrase}:{Environment.NewLine}{responseJson}");
        }

        var transcript = ExtractTranscriptText(responseJson);
        if (string.IsNullOrWhiteSpace(transcript))
            throw new InvalidOperationException("The API returned an empty transcript.");

        var outputDirectory = Path.GetDirectoryName(Path.GetFullPath(outputTextFilePath));
        if (!string.IsNullOrWhiteSpace(outputDirectory))
            Directory.CreateDirectory(outputDirectory);

        await File.WriteAllTextAsync(
            outputTextFilePath,
            transcript,
            new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
            cancellationToken);

        return transcript;
    }

    private static string ExtractTranscriptText(string responseJson)
    {
        using var document = JsonDocument.Parse(responseJson);
        if (document.RootElement.TryGetProperty("text", out var textElement))
            return textElement.GetString()?.Trim() ?? string.Empty;

        throw new InvalidOperationException("The OpenAI response does not contain a text field.");
    }

    private static string GetMimeType(string filePath) =>
        Path.GetExtension(filePath).ToLowerInvariant() switch
        {
            ".mp3" or ".mpeg" or ".mpga" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".m4a" or ".mp4" => "audio/mp4",
            ".ogg" => "audio/ogg",
            ".flac" => "audio/flac",
            ".webm" => "audio/webm",
            _ => "application/octet-stream"
        };
}
