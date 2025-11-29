const API_BASE_URL = "http://192.168.100.6:8000";

export const detectCurrency = async (imageUri, confidenceThreshold = 0.5) => {
  try {
    console.log('=== Sending Detection Request ===');
    console.log('Image URI:', imageUri);
    
    const formData = new FormData();
    
    // Get filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const fileType = filename.split('.').pop() || 'jpg';
    
    console.log('Filename:', filename);
    console.log('File type:', fileType);
    
    // Append file
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: `image/${fileType}`,
    });

    console.log('Sending POST to:', `${API_BASE_URL}/detect/`);

    const response = await fetch(`${API_BASE_URL}/detect/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✓ Detection successful:', data);
    return data;
    
  } catch (error) {
    console.error('Detection Error:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'online';
  } catch (error) {
    console.error('Health Check Error:', error);
    return false;
  }
};

export { API_BASE_URL };