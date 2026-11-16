import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Abre câmera ou galeria e devolve a imagem como data-URI (base64),
// assim ela fica guardada dentro do próprio banco SQLite.
export async function pickImage(source, aspect = [4, 3]) {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) {
    Alert.alert(
      'Permissão necessária',
      source === 'camera'
        ? 'Permita o acesso à câmera nas configurações do celular.'
        : 'Permita o acesso às fotos nas configurações do celular.'
    );
    return null;
  }

  const options = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.4,
    base64: true,
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
}

export function chooseImage(onPicked, aspect = [4, 3]) {
  Alert.alert('Adicionar foto', 'Escolha a origem da imagem', [
    {
      text: 'Câmera',
      onPress: async () => {
        const uri = await pickImage('camera', aspect);
        if (uri) onPicked(uri);
      },
    },
    {
      text: 'Galeria',
      onPress: async () => {
        const uri = await pickImage('gallery', aspect);
        if (uri) onPicked(uri);
      },
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
