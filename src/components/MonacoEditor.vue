<template>
  <div ref="editorContainer" class="w-full h-full relative"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

interface EditorProps {
  modelValue: string
  language?: string
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}

const props = withDefaults(defineProps<EditorProps>(), {
  modelValue: '',
  language: 'markdown',
  options: () => ({})
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 初始化编辑器
const initMonaco = async () => {
  if (!editorContainer.value) return
  
  await nextTick()
  
  const { width, height } = editorContainer.value.getBoundingClientRect()
  
  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    minimap: {
      enabled: false
    },
    automaticLayout: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible'
    },
    lineHeight: 20,
    padding: {
      top: 8,
      bottom: 8
    },
    dimension: {
      width,
      height
    }
  }

  editor = monaco.editor.create(editorContainer.value, {
    ...defaultOptions,
    ...props.options
  })

  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() ?? ''
    emit('update:modelValue', value)
  })
}

// 销毁编辑器
const destroyMonaco = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

// 更新编辑器内容
const updateValue = (newValue: string) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
}

// 更新编辑器配置
const updateOptions = (newOptions: monaco.editor.IStandaloneEditorConstructionOptions) => {
  if (editor) {
    editor.updateOptions(newOptions)
  }
}

onMounted(() => {
  initMonaco()
})

onBeforeUnmount(() => {
  destroyMonaco()
})

watch(() => props.modelValue, updateValue)
watch(() => props.options, updateOptions, { deep: true })

defineExpose({
  editor: () => editor
})
</script>

<style>
.monaco-editor .overflow-guard {
  border-radius: 0 !important;
}

.monaco-editor {
  padding-top: 8px;
  border-radius: 0 !important;
}

.monaco-editor .scrollbar .slider {
  background: rgba(0, 0, 0, 0.1) !important;
  border-radius: 4px !important;
}

.monaco-editor .scrollbar .slider:hover {
  background: rgba(0, 0, 0, 0.2) !important;
}
</style> 