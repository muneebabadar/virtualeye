from PIL import Image
import numpy as np
import io
from sklearn.cluster import KMeans
import webcolors

class ColorDetector:
    def __init__(self):
        """Initialize color detector"""
        self.color_names = self._get_extended_color_names()
        
    def _get_extended_color_names(self):
        """Get a comprehensive list of color names"""
        return {
            # Basic colors
            (0, 0, 0): 'black',
            (255, 255, 255): 'white',
            (128, 128, 128): 'gray',
            (192, 192, 192): 'silver',
            
            # Red family
            (255, 0, 0): 'red',
            (220, 20, 60): 'crimson',
            (139, 0, 0): 'dark red',
            (255, 192, 203): 'pink',
            (255, 20, 147): 'deep pink',
            (255, 105, 180): 'hot pink',
            (255, 182, 193): 'light pink',
            
            # Orange family
            (255, 165, 0): 'orange',
            (255, 140, 0): 'dark orange',
            (255, 69, 0): 'red orange',
            (255, 127, 80): 'coral',
            (255, 99, 71): 'tomato',
            
            # Yellow family
            (255, 255, 0): 'yellow',
            (255, 215, 0): 'gold',
            (255, 255, 224): 'light yellow',
            (189, 183, 107): 'dark khaki',
            (240, 230, 140): 'khaki',
            
            # Green family
            (0, 128, 0): 'green',
            (0, 255, 0): 'lime',
            (34, 139, 34): 'forest green',
            (0, 100, 0): 'dark green',
            (144, 238, 144): 'light green',
            (152, 251, 152): 'pale green',
            (143, 188, 143): 'dark sea green',
            (0, 255, 127): 'spring green',
            (46, 139, 87): 'sea green',
            (107, 142, 35): 'olive',
            (128, 128, 0): 'olive drab',
            
            # Blue family
            (0, 0, 255): 'blue',
            (0, 0, 139): 'dark blue',
            (0, 0, 205): 'medium blue',
            (173, 216, 230): 'light blue',
            (135, 206, 235): 'sky blue',
            (0, 191, 255): 'deep sky blue',
            (70, 130, 180): 'steel blue',
            (100, 149, 237): 'cornflower blue',
            (30, 144, 255): 'dodger blue',
            (176, 224, 230): 'powder blue',
            
            # Purple/Violet family
            (128, 0, 128): 'purple',
            (138, 43, 226): 'blue violet',
            (148, 0, 211): 'dark violet',
            (153, 50, 204): 'dark orchid',
            (186, 85, 211): 'medium orchid',
            (221, 160, 221): 'plum',
            (238, 130, 238): 'violet',
            (147, 112, 219): 'medium purple',
            (216, 191, 216): 'thistle',
            (75, 0, 130): 'indigo',
            
            # Brown family
            (165, 42, 42): 'brown',
            (139, 69, 19): 'saddle brown',
            (160, 82, 45): 'sienna',
            (205, 133, 63): 'peru',
            (210, 105, 30): 'chocolate',
            (244, 164, 96): 'sandy brown',
            (222, 184, 135): 'burlywood',
            (210, 180, 140): 'tan',
            (245, 245, 220): 'beige',
            (245, 222, 179): 'wheat',
            
            # Cyan family
            (0, 255, 255): 'cyan',
            (0, 139, 139): 'dark cyan',
            (0, 206, 209): 'dark turquoise',
            (64, 224, 208): 'turquoise',
            (72, 209, 204): 'medium turquoise',
            (175, 238, 238): 'pale turquoise',
            (127, 255, 212): 'aquamarine',
            
            # Magenta family
            (255, 0, 255): 'magenta',
            (139, 0, 139): 'dark magenta',
        }
    
    def _closest_color_name(self, rgb):
        """Find the closest color name for an RGB value"""
        min_colors = {}
        
        for color_rgb, name in self.color_names.items():
            rd = (rgb[0] - color_rgb[0]) ** 2
            gd = (rgb[1] - color_rgb[1]) ** 2
            bd = (rgb[2] - color_rgb[2]) ** 2
            min_colors[(rd + gd + bd)] = name
            
        return min_colors[min(min_colors.keys())]
    
    def _get_color_category(self, rgb):
        """Categorize color into broad categories"""
        r, g, b = rgb
        
        # Calculate brightness
        brightness = (r + g + b) / 3
        
        # Black and white
        if brightness < 30:
            return "black"
        if brightness > 225 and max(r, g, b) - min(r, g, b) < 30:
            return "white"
        
        # Gray
        if max(r, g, b) - min(r, g, b) < 30:
            if brightness < 100:
                return "dark gray"
            elif brightness < 180:
                return "gray"
            else:
                return "light gray"
        
        # Determine dominant channel
        max_channel = max(r, g, b)
        
        # Red dominant
        if r == max_channel and r > g + 30 and r > b + 30:
            return "red"
        
        # Green dominant
        if g == max_channel and g > r + 30 and g > b + 30:
            return "green"
        
        # Blue dominant
        if b == max_channel and b > r + 30 and b > g + 30:
            return "blue"
        
        # Mixed colors
        if r > 200 and g > 100 and g < 200 and b < 100:
            return "orange"
        
        if r > 200 and g > 200 and b < 100:
            return "yellow"
        
        if r > 150 and b > 150 and g < 150:
            return "purple"
        
        if g > 150 and b > 150 and r < 150:
            return "cyan"
        
        if r > 100 and g < 100 and b < 100:
            return "brown"
        
        return "mixed color"
    
    def detect_color(self, image_bytes, n_colors=3):
        """
        Detect dominant colors in an image
        
        Args:
            image_bytes: Image as bytes
            n_colors: Number of dominant colors to extract
            
        Returns:
            dict: Color detection results with dominant colors and names
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Resize for faster processing
        image.thumbnail((300, 300))
        
        # Convert to numpy array
        image_np = np.array(image)
        
        # Reshape image to be a list of pixels
        pixels = image_np.reshape(-1, 3)
        
        # Use KMeans to find dominant colors
        kmeans = KMeans(n_clusters=min(n_colors, len(pixels)), random_state=42, n_init=10)
        kmeans.fit(pixels)
        
        # Get the colors
        colors = kmeans.cluster_centers_.astype(int)
        
        # Get the count of pixels for each cluster
        labels = kmeans.labels_
        counts = np.bincount(labels)
        
        # Sort colors by frequency
        indices = np.argsort(-counts)
        sorted_colors = colors[indices]
        sorted_counts = counts[indices]
        
        # Calculate percentages
        total_pixels = len(pixels)
        percentages = (sorted_counts / total_pixels * 100).tolist()
        
        # Create results
        dominant_colors = []
        for i, (color, percentage) in enumerate(zip(sorted_colors, percentages)):
            # Convert numpy integers to Python integers for JSON serialization
            rgb = tuple(int(x) for x in color)
            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
            
            # Get color name
            color_name = self._closest_color_name(rgb)
            category = self._get_color_category(rgb)
            
            dominant_colors.append({
                'rank': i + 1,
                'rgb': rgb,
                'hex': hex_color,
                'name': color_name,
                'category': category,
                'percentage': round(percentage, 2),
                'is_primary': i == 0
            })
        
        # Primary color for announcement
        primary_color = dominant_colors[0] if dominant_colors else None
        
        return {
            'dominant_colors': dominant_colors,
            'primary_color': primary_color,
            'color_count': len(dominant_colors),
            'image_size': {
                'width': image.width,
                'height': image.height
            }
        }
    
    def detect_color_simple(self, image_bytes):
        """
        Detect single dominant color - optimized for real-time feedback
        
        Args:
            image_bytes: Image as bytes
            
        Returns:
            dict: Single dominant color information
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Resize to very small for fast processing
        image.thumbnail((100, 100))
        
        # Convert to numpy array
        image_np = np.array(image)
        
        # Get center region (middle 50% of image) for more accurate color
        h, w = image_np.shape[:2]
        center_h_start, center_h_end = h // 4, 3 * h // 4
        center_w_start, center_w_end = w // 4, 3 * w // 4
        center_region = image_np[center_h_start:center_h_end, center_w_start:center_w_end]
        
        # Calculate average color of center region
        avg_color = center_region.reshape(-1, 3).mean(axis=0).astype(int)
        # Convert numpy integers to Python integers for JSON serialization
        rgb = tuple(int(x) for x in avg_color)
        
        hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
        color_name = self._closest_color_name(rgb)
        category = self._get_color_category(rgb)
        
        return {
            'rgb': rgb,
            'hex': hex_color,
            'name': color_name,
            'category': category,
            'description': f"The dominant color is {color_name}"
        }