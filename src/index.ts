import { defineComponent } from 'vue';
type VueObjType = Parameters<typeof defineComponent>[0];

type EventEnhanced = Event;
function hijackDataFunction(vueObj: VueObjType) {
  const oldDataFunc = vueObj.data ?? (() => ({}));

  type thisType = ThisParameterType<typeof oldDataFunc>;
  type dataParams = Parameters<typeof oldDataFunc>;

  function newDataFunc(this: thisType, ...params: dataParams) {
    return {
      ...(oldDataFunc.apply(this, params) as Record<string, unknown>),
      pageIsReady: false,
    };
  }
  return newDataFunc;
}

function hijackMountedCreated(vueObj: VueObjType) {
  let createDone = false;
  let mountedDone = false;
  const oldCreated = vueObj.created ?? (() => Promise.resolve());
  const oldMounted = vueObj.mounted ?? (() => Promise.resolve());
  type CreatedThisType = ThisParameterType<typeof vueObj.created> & {
    pageIsReady: boolean;
  };
  type MountedThisType = ThisParameterType<typeof vueObj.mounted> & {
    pageIsReady: boolean;
  };

  function whenLoadedDone(this: CreatedThisType) {
    this.pageIsReady = createDone && mountedDone;
  }
  async function newCreated(
    this: CreatedThisType,
    ...params: Parameters<typeof oldCreated>
  ) {
    await oldCreated.apply(this, params);
    createDone = true;
    whenLoadedDone.call(this);
  }
  async function newMounted(
    this: MountedThisType,
    ...params: Parameters<typeof oldMounted>
  ) {
    await oldMounted.apply(this, params);
    mountedDone = true;
    whenLoadedDone.call(this);
  }
  vueObj.created = newCreated;
  vueObj.mounted = newMounted;
}

function changeCursor(btn?: HTMLElement) {
  if (btn == null) {
    return () => true;
  }
  const oldCursor = btn.style.cursor;
  btn.style.cursor = 'wait';
  return () => {
    btn.style.cursor = oldCursor;
  };
}

function throttleMethod(vueObj: VueObjType, methodName: string) {
  type CreatedThisType = ThisParameterType<typeof vueObj.created> & {
    readonly pageIsReady: boolean;
  };
  const originalMethod = vueObj.methods?.[methodName];
  if (originalMethod == null) return;
  let pending = false;
  async function wrapperMethod(
    this: CreatedThisType,
    ...args: readonly unknown[]
  ) {
    if (originalMethod == null) return;
    if (pending) {
      return;
    }
    const event = args[args.length - 1] as EventEnhanced;
    const btn = (event || {}).target as HTMLElement;
    const recoverCursor = changeCursor(btn);

    pending = true;
    try {
      await originalMethod.apply(this, args);
    } catch (error) {
      console.error(error);
    } finally {
      pending = false;
      recoverCursor();
    }
  }
  if (vueObj.methods == null) {
    vueObj.methods = {};
  }
  vueObj.methods[methodName] = wrapperMethod;
}

function hijackMethods(vueObj: VueObjType) {
  const methods = vueObj.methods;
  if (methods == null) return;
  const methodsNames = Object.keys(methods).filter((name) =>
    name.startsWith('on')
  );
  methodsNames.forEach((name) => {
    throttleMethod(vueObj, name);
  });
}

export function powerfulDefineComponent(
  ...params: Parameters<typeof defineComponent>
) {
  const vueObj = params[0];

  vueObj.data = hijackDataFunction(vueObj);
  hijackMountedCreated(vueObj);
  hijackMethods(vueObj);
  return defineComponent(...params);
}
