import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { getTarotCardImage } from "./cardImages";

const CARD_BACK_IMAGE = require("../../../assets/images/CardsBack.png");

type TarotCardImageProps = {
  cardId?: number | null;
  isReversed?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

type TarotCardBackProps = {
  label?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TarotCardImage({
  cardId,
  isReversed,
  style,
  imageStyle,
}: TarotCardImageProps) {
  const source = getTarotCardImage(cardId);

  if (!source) {
    return <TarotCardBack compact style={style} />;
  }

  return (
    <View style={[styles.imageShell, style]}>
      <Image
        source={source}
        resizeMode="stretch"
        style={[
          styles.cardImage,
          isReversed && styles.cardImageReversed,
          imageStyle,
        ]}
      />
    </View>
  );
}

export function TarotCardBack({ style }: TarotCardBackProps) {
  return (
    <View style={[styles.backShell, style]}>
      <Image source={CARD_BACK_IMAGE} resizeMode="stretch" style={styles.cardBackImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageShell: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  cardImageReversed: {
    transform: [{ rotate: "180deg" }],
  },

  backShell: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  cardBackImage: {
    width: "100%",
    height: "100%",
  },
});
