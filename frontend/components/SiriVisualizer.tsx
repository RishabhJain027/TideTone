"use client";

import React, { useRef, useEffect } from "react";

interface SiriVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

export default function SiriVisualizer({ analyserNode, isPlaying }: SiriVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Gravitational Black Hole / Accretion Disk Quantum Shader
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform float u_bass;
      uniform float u_mid;
      uniform float u_treble;
      uniform vec2 u_res;

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
        float r = length(uv);
        float angle = atan(uv.y, uv.x);

        // Relativistic Space Warping (Gravitational Lensing)
        float rs = 0.22 + (u_bass * 0.06); // Schwarzschild Event Horizon Radius
        float warpedR = r + (rs * rs * 0.45) / max(r, 0.001);

        // Swirling Accretion Disk
        float diskSpeed = u_time * 2.5 + (u_bass * 5.0);
        float spiralAngle = angle + (1.6 / max(r, 0.08)) - diskSpeed;
        
        // Relativistic Beaming / Doppler Shift (Left side approaching is brighter)
        float doppler = 0.65 + 0.45 * cos(angle - 0.4);

        // Multi-frequency plasma turbulence in accretion disk
        float f1 = sin(spiralAngle * 3.0 + warpedR * 22.0 - u_time * 3.0) * 0.5 + 0.5;
        float f2 = cos(spiralAngle * 7.0 - warpedR * 35.0 + u_time * 4.5) * 0.5 + 0.5;
        float f3 = sin(angle * 5.0 + u_time * 6.0) * (u_treble * 1.5);
        float diskIntensity = pow(f1 * f2, 1.4) * (1.0 + f3);

        // Accretion Disk Radiant Heat Colors
        vec3 colCoreWhite  = vec3(1.0, 0.98, 0.92);
        vec3 colCyanPhoton = vec3(0.0, 0.85, 1.0);
        vec3 colAmberFlare = vec3(1.0, 0.55, 0.15);
        vec3 colVioletAura = vec3(0.65, 0.20, 1.0);

        // Accretion zone mask (Elliptical inclination for 3D depth)
        vec2 tiltedUV = vec2(uv.x, uv.y * 2.2);
        float diskDist = length(tiltedUV);
        float diskMask = smoothstep(rs, rs + 0.04, diskDist) * smoothstep(0.48 + u_bass * 0.1, rs + 0.02, diskDist);

        // Photon Sphere / Relativistic Ring
        float photonRadius = rs * 1.35 + (u_mid * 0.04);
        float photonRing = exp(-pow((r - photonRadius) * 45.0, 2.0)) * (1.5 + u_bass * 2.0);

        // Outer Gravitational Jet / Plasma Glow
        float jetGlow = exp(-pow((diskDist - 0.28) * 12.0, 2.0)) * (0.6 + u_mid * 0.8);

        // Color Composition
        vec3 diskColor = mix(colAmberFlare, colCyanPhoton, f1) * doppler * (1.5 + u_bass);
        diskColor = mix(diskColor, colCoreWhite, pow(diskIntensity, 2.0) * 0.8);

        vec3 finalColor = (diskColor * diskMask * (1.2 + diskIntensity)) 
                        + (colCyanPhoton * photonRing * 1.4) 
                        + (colVioletAura * jetGlow * 0.8);

        // Event Horizon (Absolute Singularity Black Core)
        float horizonMask = smoothstep(rs - 0.005, rs + 0.008, r);
        finalColor *= horizonMask;

        // Subtle core singularity rim
        if (r < rs + 0.015 && r > rs - 0.005) {
          finalColor += colCyanPhoton * 0.8 * (u_bass + 0.3);
        }

        float totalAlpha = clamp(length(finalColor) * 0.9 + (1.0 - horizonMask) * 0.95, 0.0, 1.0);
        gl_FragColor = vec4(finalColor, totalAlpha);
      }
    `;

    const createShader = (glCtx: WebGLRenderingContext, type: number, src: string) => {
      const s = glCtx.createShader(type);
      if (!s) return null;
      glCtx.shaderSource(s, src);
      glCtx.compileShader(s);
      return s;
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uBass = gl.getUniformLocation(program, "u_bass");
    const uMid = gl.getUniformLocation(program, "u_mid");
    const uTreble = gl.getUniformLocation(program, "u_treble");
    const uRes = gl.getUniformLocation(program, "u_res");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let animId: number;
    const startTime = performance.now();
    const dataArray = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 128);

    let smoothBass = 0;
    let smoothMid = 0;
    let smoothTreble = 0;

    const render = () => {
      const elapsed = (performance.now() - startTime) * 0.001;

      let targetBass = 0;
      let targetMid = 0;
      let targetTreble = 0;

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        targetBass = (dataArray[1] + dataArray[2] + dataArray[3] + dataArray[4]) / (4 * 255);
        targetMid = (dataArray[8] + dataArray[12] + dataArray[16] + dataArray[20]) / (4 * 255);
        targetTreble = (dataArray[30] + dataArray[40] + dataArray[50]) / (3 * 255);
      } else {
        // Hypnotic cosmic orbital rotation when idle
        targetBass = 0.06 + Math.sin(elapsed * 1.6) * 0.04;
        targetMid = 0.04 + Math.cos(elapsed * 1.3) * 0.03;
        targetTreble = 0.03 + Math.sin(elapsed * 2.1) * 0.02;
      }

      smoothBass += (targetBass - smoothBass) * 0.2;
      smoothMid += (targetMid - smoothMid) * 0.2;
      smoothTreble += (targetTreble - smoothTreble) * 0.2;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uBass, smoothBass);
      gl.uniform1f(uMid, smoothMid);
      gl.uniform1f(uTreble, smoothTreble);
      gl.uniform2f(uRes, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buffer);
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="relative w-full aspect-square max-w-[420px] flex items-center justify-center">
      {/* Cosmic Gravitational Singularity Glow */}
      <div
        className={`absolute inset-4 rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
          isPlaying
            ? "bg-gradient-to-tr from-cyan-500/40 via-amber-500/40 to-purple-600/50 scale-125 opacity-100"
            : "bg-gradient-to-tr from-cyan-600/25 via-amber-600/25 to-purple-700/30 scale-100 opacity-70"
        }`}
      />
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="relative z-10 w-full h-full rounded-full"
      />
    </div>
  );
}
