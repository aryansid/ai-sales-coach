const fragmentShader = `
uniform float u_intensity;
uniform float u_time;
uniform int u_colorId;

varying vec2 vUv;
varying float vDisplacement;

void main() {
    float distort = 2.0 * vDisplacement * u_intensity * sin(vUv.y * 10.0 + u_time);
    
    // Define our three base colors
    vec3 colors[4];
    colors[0] = vec3(0.7 + abs(vUv.x - 0.5) * (1.0 - distort),  // Light purple
                     0.4 + abs(vUv.y - 0.5) * (1.0 - distort), 
                     0.9);
                     
    colors[1] = vec3(0.4 + abs(vUv.x - 0.5) * (1.0 - distort),  // Light blue
                     0.7 + abs(vUv.y - 0.5) * (1.0 - distort),
                     0.9);
                     
    colors[2] = vec3(0.9 + abs(vUv.x - 0.5) * (1.0 - distort),  // Light orange
                     0.6 + abs(vUv.y - 0.5) * (1.0 - distort),
                     0.3);
    
    // Create a mixed color by blending all three
    vec3 mixedColor = (colors[0] + colors[1] + colors[2]) / 3.0;
    colors[3] = mixedColor;
    
    // Choose your color (mixedColor or one of the base colors)
    vec3 color = colors[u_colorId];  // Or use colors[0], colors[1], or colors[2]
    
    gl_FragColor = vec4(color, 1.0);
}

`;

export default fragmentShader;