#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535

uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_tex0;
uniform vec2 u_tex0resolution;

// LIGHT Functions and Structs
struct Light { vec3 ambient, diffuse, specular; };
struct PointLight { Light emission; vec3 position; };
struct Material { Light bounce; vec3 emission; float shininess;};

void computeLight(in PointLight _light,in Material _material, in vec3 _normal, inout Light _accumulator ){
    vec3 lightDirection = normalize(_light.position);
    _accumulator.ambient += _light.emission.ambient;
    float diffuseFactor = max(0.0,dot(-lightDirection,_normal));
    _accumulator.diffuse += _light.emission.diffuse * diffuseFactor;
    if (diffuseFactor > 0.0) {
        float specularFactor = max(0.0,pow(diffuseFactor, _material.shininess));
        if (specularFactor > 0.0) {
            _accumulator.specular += _light.emission.specular * specularFactor;
        }
    }
}

vec3 calculate(in Material _material, in Light _light){
    vec3 color = vec3(0.0);
    color += _material.emission;
    color += _material.bounce.ambient * _light.ambient;
    color += _material.bounce.diffuse * _light.diffuse;
    color += _material.bounce.specular * _light.specular;
    return color;
}

// SPHERE functions
vec3 sphereNormal(vec2 uv) {
    uv = fract(uv)*2.0-1.0; 
    vec3 ret;
    ret.xy = sqrt(uv * uv) * sign(uv);
    ret.z = sqrt(abs(1.0 - dot(ret.xy,ret.xy)));
    ret = ret * 0.5 + 0.5;    
    return mix(vec3(0.0), ret, smoothstep(1.0,0.98,dot(uv,uv)) );
}

vec2 fishEye(vec2 _uv, float _aperture){
    float apertureHalf = 0.5 * _aperture;
    float maxFactor = sin(apertureHalf);
    vec2 uv = vec2(0.0);
    vec2 xy = 2.0 * _uv.xy - 1.0;
    float d = length(xy);
    if (d < (2.0-maxFactor)){
        d = length(xy * maxFactor);
        float z = sqrt(1.0 - d * d);
        float r = atan(d, z) / PI;
        float phi = atan(xy.y, xy.x);

        uv.x = r * cos(phi) + 0.5;
        uv.y = r * sin(phi) + 0.5;
    } else {
        uv = _uv.xy;
    }
    return uv;
}

// SCENE Definitions
//---------------------------------------------------

//  Light accumulator
Light l = Light(vec3(0.0),vec3(0.0),vec3(0.0)); 

//  Material
Material m = Material(Light(vec3(0.8),vec3(0.8),vec3(0.4)),vec3(0.0),20.0);

// Lights
PointLight a = PointLight(Light(vec3(0.1),vec3(0.0,0.5,0.8),vec3(0.0,1.0,1.0)),vec3(1.0));
PointLight b = PointLight(Light(vec3(0.25),vec3(0.8,0.5,0.0),vec3(1.0,1.0,0.0)),vec3(1.0));

// Edges
float edgeRadius = 0.985;
vec3 edgeColor = vec3(0.0);


void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    vec3 normal = normalize(sphereNormal(st)*2.0-1.0);

    if(u_tex0resolution != vec2(0.0)){
        normal += texture2D(u_tex0, fishEye(st, PI)).rgb*2.0-1.0;
        normal = normalize(normal);
    }
    
    a.position = vec3(cos(u_time),0.0,sin(u_time))*4.0 ;
    computeLight(a,m,normal,l);
  
    b.position = normalize(vec3(cos(u_time*0.1),cos(u_time*1.2),sin(u_time*1.2)));
    computeLight(b,m,normal,l);
  
    color = calculate(m,l);
  
    // turn black the area around the sphere;
    float radius = length( vec2(0.5)-st )*2.0;
    color = mix(color,edgeColor,smoothstep(edgeRadius,1.0,radius));
  
    gl_FragColor = vec4(color, 1.0);
}