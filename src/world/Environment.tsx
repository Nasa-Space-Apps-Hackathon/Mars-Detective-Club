"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RuntimeRef } from "./runtime";
import { groundHeight } from "./worldConfig";
import { getStormCenter, STORMS, type DustDevil } from "./weather";
import { SKY_HORIZON } from "./Sky";

const noise = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p) {
  float v=0.0, a=0.5;
  for(int i=0;i<4;i++){v+=a*noise2(p); p=p*2.04+vec2(12.3,7.6); a*=0.5;}
  return v;
}`;

const cloudVertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

const cloudFragment = `
uniform float uTime;
uniform float uSeed;
uniform float uOpacity;
varying vec2 vUv;
${noise}
void main(){
  vec2 p=vUv*vec2(5.,9.);
  p.x+=uTime*.008+uSeed;
  p.y+=sin(p.x*.8)*.45;
  float density=fbm(p+fbm(p*.5));
  float ribbons=smoothstep(.43,.7,density);
  float edge=smoothstep(0.,.18,vUv.x)*(1.-smoothstep(.8,1.,vUv.x))*smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.8,1.,vUv.y));
  vec3 color=mix(vec3(.79,.64,.54),vec3(1.,.91,.78),density);
  gl_FragColor=vec4(color,ribbons*edge*uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Thin ice-cloud layers supplement the existing Mars sky, sun and two moons. */
export function CloudLayers({ runtime }: { runtime: RuntimeRef }) {
  const layers = useRef<THREE.Group>(null);
  const cloudMaterials = useMemo(() => Array.from({ length: 4 }, (_, i) => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: i * 13.7 }, uOpacity: { value: 0.62 - i * 0.08 } },
    vertexShader: cloudVertex, fragmentShader: cloudFragment,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  })), []);
  useEffect(() => () => {
    cloudMaterials.forEach((material) => material.dispose());
  }, [cloudMaterials]);
  useFrame(() => {
    for (const material of cloudMaterials) material.uniforms.uTime.value = runtime.current.simTime;
    if (layers.current) layers.current.position.set(runtime.current.position.x * 0.65, 0, runtime.current.position.z * 0.65);
  });
  return (
      <group ref={layers}>
        {cloudMaterials.map((material, i) => (
          <mesh key={i} position={[(i - 1.5) * 45, 45 + i * 9, -30 - i * 28]} rotation={[-Math.PI / 2, 0, i * 0.3]} material={material} renderOrder={-1}>
            <planeGeometry args={[250, 230]} />
          </mesh>
        ))}
      </group>
  );
}

function makeSeeds(count: number, seedValue: number) {
  let seed = seedValue;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < seeds.length; i++) seeds[i] = random();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(seeds, 3));
  return geometry;
}

function DustDevilVisual({ storm, runtime }: { storm: DustDevil; runtime: RuntimeRef }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => makeSeeds(1900, Math.floor(storm.phase * 1000) + 17), [storm.phase]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uHeight: { value: storm.height }, uSpin: { value: storm.spin },
      uColor: { value: new THREE.Color("#d99466") }, uFog: { value: new THREE.Color(SKY_HORIZON) },
    },
    transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime;uniform float uHeight;uniform float uSpin;
      varying float vOpacity;varying float vDepth;varying float vLight;
      void main(){
        float h=fract(position.x+uTime*.075);
        float angle=position.y*6.28318+uTime*(1.8-h*.7)*uSpin+h*14.;
        float radius=(.45+pow(h,1.45)*4.7)*(.65+position.z*.65);
        vec3 p=vec3(cos(angle)*radius,h*uHeight,sin(angle)*radius);
        p.x+=sin(h*4.+uTime*.45)*h*1.6;
        p.z+=cos(h*5.+uTime*.35)*h;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        float size=.32+position.z*.85+h*.7;
        gl_PointSize=clamp(size*500./max(-mv.z,1.),1.,64.);
        vOpacity=smoothstep(0.,.08,h)*(1.-smoothstep(.65,1.,h))*(.10+position.z*.19);
        vDepth=-mv.z;vLight=.5+.5*sin(angle);
      }`,
    fragmentShader: `
      uniform vec3 uColor;uniform vec3 uFog;
      varying float vOpacity;varying float vDepth;varying float vLight;
      void main(){
        float d=length(gl_PointCoord-vec2(.5))*2.;
        float alpha=pow(max(0.,1.-d*d),2.)*vOpacity;
        if(alpha<.008)discard;
        vec3 color=uColor*(.8+vLight*.32);
        color=mix(color,uFog,smoothstep(35.,140.,vDepth)*.8);
        gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }), [storm.height, storm.spin]);
  const baseMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSpin: { value: storm.spin } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: cloudVertex,
    fragmentShader: `uniform float uTime;uniform float uSpin;varying vec2 vUv;${noise}
      void main(){vec2 p=vUv-.5;float r=length(p)*2.;float angle=atan(p.y,p.x);
      float n=fbm(vec2(angle*2.+uTime*uSpin,r*6.-uTime*.5));
      float alpha=(1.-smoothstep(.2,1.,r))*(.12+n*.2)*smoothstep(0.,.08,r);
      gl_FragColor=vec4(vec3(.77,.45,.28),alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  }), [storm.spin]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); baseMaterial.dispose(); }, [geometry, material, baseMaterial]);
  useFrame(() => {
    const time = runtime.current.simTime;
    const center = getStormCenter(storm, time);
    if (group.current) group.current.position.set(center.x, groundHeight(center.x, center.z), center.z);
    material.uniforms.uTime.value = time;
    baseMaterial.uniforms.uTime.value = time;
  });
  const initial = getStormCenter(storm, 0);
  return (
    <group ref={group} position={[initial.x, groundHeight(initial.x, initial.z), initial.z]}>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]} material={baseMaterial}>
        <planeGeometry args={[storm.radius * 1.7, storm.radius * 1.7]} />
      </mesh>
    </group>
  );
}

export function Storms({ runtime }: { runtime: RuntimeRef }) {
  return <>{STORMS.map((storm) => <DustDevilVisual key={storm.id} storm={storm} runtime={runtime} />)}</>;
}

export default function Environment({ runtime }: { runtime: RuntimeRef }) {
  return (
    <>
      <CloudLayers runtime={runtime} />
      <Storms runtime={runtime} />
    </>
  );
}
