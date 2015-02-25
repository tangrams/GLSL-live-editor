// Created by patricio gonzalez vivo - 2015
// http://shiny.ooo/~patriciogv/

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define HALF_PI 1.57079632679

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

uniform sampler2D u_tex1;
uniform vec2 u_tex1Resolution;

// LIGHT Functions and Structs
struct Light { vec3 ambient, diffuse, specular; };
struct DirectionalLight { Light emission; vec3 direction; };
struct PointLight { Light emission; vec3 position; };
struct Material { Light bounce; vec3 emission; float shininess;};

void computeLight(in DirectionalLight _light, in Material _material, in vec3 _pos, in vec3 _normal, inout Light _accumulator ){
    _accumulator.ambient += _light.emission.ambient;

    float diffuseFactor = max(0.0,dot(_normal,-_light.direction));
    _accumulator.diffuse += _light.emission.diffuse * diffuseFactor;

    if (diffuseFactor > 0.0) {
        vec3 reflectVector = reflect(_light.direction, _normal);
        float specularFactor = max(0.0,pow( dot(normalize(_pos), reflectVector), _material.shininess));
        _accumulator.specular += _light.emission.specular * specularFactor;
    }

}

void computeLight(in PointLight _light, in Material _material, in vec3 _pos, in vec3 _normal, inout Light _accumulator ){
    float dist = length(_light.position - _pos);
    vec3 lightDirection = (_light.position - _pos)/dist;

    _accumulator.ambient += _light.emission.ambient;

    float diffuseFactor = max(0.0,dot(lightDirection,_normal));
    _accumulator.diffuse += _light.emission.diffuse * diffuseFactor;

    if (diffuseFactor > 0.0) {
        vec3 reflectVector = reflect(-lightDirection, _normal);
        float specularFactor = max(0.0,pow( dot(-normalize(_pos), reflectVector), _material.shininess));
        _accumulator.specular += _light.emission.specular * specularFactor;
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

vec3 rim (in vec3 _normal, in float _pct) {
    float cosTheta = abs( dot( vec3(0.0,0.0,-1.0) , _normal));
    return vec3( _pct * ( 1. - smoothstep( 0.0, 1., cosTheta ) ) );
}

//  Light accumulator
Light l = Light(vec3(0.0),vec3(0.0),vec3(0.0)); 

//  Material
Material m = Material(Light(vec3(0.8),vec3(0.8),vec3(0.4)),vec3(0.0),20.0);

// Lights
DirectionalLight a = DirectionalLight(Light(vec3(0.1),vec3(0.0,0.3,0.8),vec3(0.0,0.6,0.8)),vec3(1.0));
PointLight b = PointLight(Light(vec3(0.1),vec3(0.6,0.2,0.0),vec3(1.0,1.0,0.0)),vec3(1.0));

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);
    vec3 normal = vec3(0.0);
    vec3 pos = vec3(0.0);

    if (st.x < 0.5){
        normal = texture2D(u_tex0,st).rgb;
    } else {
        normal = texture2D(u_tex1,st).rgb;
    }

    normal -= 0.5;
    normal *= 2.0;
    pos = normal;

    a.direction = vec3(-cos(u_time*0.25),cos(u_time*0.5),sin(u_time*0.5));
    computeLight(a,m,pos,normal,l);
  
    vec2 mouse = u_mouse.xy/u_resolution.xy;
    mouse *= -2.0;
    mouse -= 1.0;
    b.position = vec3(cos(mouse.x*-HALF_PI+HALF_PI),sin(mouse.y*HALF_PI),1.0)*2.0;
    computeLight(b,m,pos,normal,l);

    color = calculate(m,l);
    color += rim(normal, 0.5);

    gl_FragColor = vec4(color,1.0);
}