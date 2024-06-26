// custom.d.ts

// 声明全局模块
declare module '*.png' {
  const value: string; // 图片的导出类型
  export default value;
}
