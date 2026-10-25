import { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App startup error", error, errorInfo.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Приложение не смогло открыться</Text>
        <Text style={styles.text}>
          Ошибка поймана на старте. Сделай скрин этого экрана или пришли текст
          ниже.
        </Text>
        <Text selectable style={styles.errorText}>
          {this.state.error.message}
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.buttonText}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0B0718",
  },

  title: {
    color: "#F6CD3D",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14,
  },

  text: {
    color: "#D8CBFF",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
  },

  errorText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 19,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 18,
  },

  button: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8C436",
  },

  buttonText: {
    color: "#05020A",
    fontSize: 16,
    fontWeight: "900",
  },
});
