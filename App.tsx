import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView } from "react-native";
import { Button, ButtonText } from "./components/ui/button";

export default function App() {
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <ScrollView contentContainerClassName="flex-grow items-center justify-center gap-6 p-8">
        <Text className="text-3xl font-bold text-gray-900">pagos-cr</Text>
        <Text className="text-base text-gray-500 text-center">
          Expo SDK 54 · expo-sqlite · NativeWind v4 · Gluestack UI v3
        </Text>

        <View className="w-full gap-3 mt-4">
          <Button action="primary" size="md">
            <ButtonText>Botón primario</ButtonText>
          </Button>

          <Button action="positive" size="md">
            <ButtonText>Pago confirmado</ButtonText>
          </Button>

          <Button action="negative" size="md">
            <ButtonText>Cobro vencido</ButtonText>
          </Button>

          <Button variant="outline" size="md">
            <ButtonText className="text-gray-700">Outline</ButtonText>
          </Button>

          <Button isDisabled size="md">
            <ButtonText>Deshabilitado</ButtonText>
          </Button>
        </View>

        <View className="w-full bg-gray-50 rounded-xl p-4 mt-4 gap-2">
          <Text className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Stack activo
          </Text>
          {[
            "Expo SDK 54",
            "expo-sqlite 16",
            "NativeWind 4",
            "Gluestack UI v3",
            "React Native 0.81",
          ].map((item) => (
            <Text key={item} className="text-sm text-gray-600">
              ✓ {item}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
