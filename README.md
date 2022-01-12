#[powerful-componet](https://github.com/panjiangyi/powerful-component)

> 觉得好用的话，兄弟们帮忙点个 star。
> [仓库地址](https://github.com/panjiangyi/powerful-component)

是一个包装 Vue 对象的工具函数。
支持 Vue2 和 Vue3

在 Vue3 下支持 Typescript.

> 其实 Vue2 也可以支持 Typescript。但是没有必要。

```
npm install --save powerful-component
```

仅仅需要你遵循很少的规范，便可以使你的 Vue 组件得到增强。

获得以下功能.

## 页面是否加载完成的变量

### pageIsReady。

默认为 false，当 mounted 和 created 都执行完成时会，pageIsReady 变为 true

### 约定

需要保证 mounted 和 created 是 async/await 风格写法。以保证 pageIsReady 变量能得知异步请求执行完成了。

### 例子

```vue
<script lang="ts">
import powerfulDefineComponent from 'powerful-component';
export default powerfulDefineComponent({
  methods: {
    //onClick执行完成之前，不会执行下一次
    async onClick() {
      await new Promise((done) => setTimeout(done, 1000));
    },
  },
});
</script>

<template>
  // 这个按钮在onClick执行期间会获得loading样式
  <button type="button" @click="onClick"></button>
</template>
```

## 点击事件防抖，并增加 loading 样式

以 on 开头的方法都会被增加防抖功能，并能对被点击的按钮增加 loading 样式

### 约定

1. 方法名以 on 开头
2. async/await 风格写法。这样 powerful-componet 才会知道方法是不是执行完成了
3. 方法参数列表最后一个是点击事件的 event，这样才能得到 dom 元素，添加样式。

### 例子

```vue
<script lang="ts">
import powerfulDefineComponent from 'powerful-component';
export default powerfulDefineComponent({
  methods: {
    async created() {
      await new Promise((done) => setTimeout(done, 1000));
    },
    async mounted() {
      await new Promise((done) => setTimeout(done, 2000));
    },
  },
});
</script>

<template>
  //created和mounted都执行完成后，pageIsReady为true
  <h1>页面加载完成：{{ pageIsReady }}</h1>
</template>
```

## 尾声

这个库的核心思想来源于这篇文章[活用 async/await，实现一些让 Vue 更好用的装饰器](https://segmentfault.com/a/1190000037604556)
