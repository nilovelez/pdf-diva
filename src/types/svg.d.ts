// esbuild importa los .svg como texto (ver esbuild.mjs).
declare module '*.svg' {
  const svg: string;
  export default svg;
}
