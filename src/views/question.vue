<template>
  <div class="w-full h-full overflow-auto p-5">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-gray-600">加载中...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div class="text-red-600">{{ error }}</div>
    </div>

    <!-- 题目内容 -->
    <template v-else-if="question">
      <!-- 题目头部信息 -->
      <div class="border-2 border-dashed mb-5">
        <div class="p-4 border-b-2 border-dashed flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-medium">{{ question.title }}</h1>
          </div>
          <div class="flex gap-2">
            <span v-for="tag in question.tags" 
                  :key="tag"
                  class="px-3 py-1 text-sm border-2 border-dashed hover:bg-[#e5e7eb]">
              {{ tag }}
            </span>
          </div>
        </div>
        
        <!-- 题目统计信息 -->
        <div class="p-4 flex gap-8 text-sm text-gray-600">
          <div>作者：{{ question.author.login }}</div>
          <div>创建时间：{{ new Date(question.createdAt).toLocaleDateString() }}</div>
          <div>评论数：{{ question.comments }}</div>
          <div>反应数：{{ question.reactions.totalCount }}</div>
        </div>
      </div>

      <!-- 题目描述 -->
      <div class="p-4 border-b-2 border-dashed">
        <p class="text-gray-600">{{ question.body }}</p>
      </div>

      <!-- 题目内容和编辑器区域 -->
      <div class="grid grid-cols-2 gap-5 h-[calc(100%-11rem)]">
        <!-- 左侧：题目详细内容 -->
        <div class="border-2 border-dashed overflow-auto">
          <div class="p-4 border-b-2 border-dashed">
            <h2 class="text-lg font-medium">题目详情</h2>
          </div>
          <div class="p-4 prose prose-sm max-w-none" v-html="renderedContent"></div>
        </div>

        <!-- 右侧：Prompt编辑器 -->
        <div class="border-2 border-dashed flex flex-col">
          <div class="p-4 border-b-2 border-dashed flex justify-between items-center">
            <h2 class="text-lg font-medium">编写 Prompt</h2>
            <div class="flex gap-2">
              <button 
                @click="addPrompt"
                class="px-4 py-2 border-2 border-dashed hover:bg-[#e5e7eb]">
                添加对话
              </button>
              <button 
                @click="handleSubmit"
                class="px-4 py-2 border-2 border-dashed hover:bg-[#e5e7eb]">
                提交
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-auto">
            <div v-for="(prompt, index) in prompts" 
                 :key="index"
                 class="border-b-2 border-dashed last:border-b-0">
              <!-- 编辑器头部 -->
              <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <select 
                    v-model="prompt.role"
                    class="px-3 py-1 border-2 border-dashed focus:outline-none hover:bg-[#e5e7eb]">
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="assistant">Assistant</option>
                  </select>
                  <span class="text-sm text-gray-500">
                    {{ getRoleDescription(prompt.role) }}
                  </span>
                </div>
                <button 
                  @click="removePrompt(index)"
                  class="text-red-500 hover:text-red-700">
                  删除
                </button>
              </div>
              <!-- 编辑器 -->
              <div class="h-[200px]">
                <MonacoEditor
                  v-model="prompt.content"
                  language="markdown"
                  :options="editorOptions as any"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getQuestion } from '../services/github'
import type { Question } from '../services/github'
import MonacoEditor from '../components/MonacoEditor.vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const route = useRoute()
const question = ref<Question | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const id = parseInt(route.params.id as string)
    question.value = await getQuestion(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用默认的转义
  }
})

// 编辑器配置
const editorOptions = {
  theme: 'vs',
  fontSize: 14,
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  minimap: {
    enabled: false
  },
  wordWrap: 'on'
}

// 渲染 Markdown 内容
const renderedContent = computed(() => md.render(question.value?.body || ''))

interface Prompt {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Prompts列表
const prompts = ref<Prompt[]>([
  {
    role: 'system',
    content: ''
  }
])

// 获取角色描述
const getRoleDescription = (role: string) => {
  switch (role) {
    case 'system':
      return '系统指令 - 设定对话的背景和规则'
    case 'user':
      return '用户输入 - 模拟用户的提问或要求'
    case 'assistant':
      return 'AI助手 - 模拟AI的回复'
    default:
      return ''
  }
}

// 添加新的Prompt
const addPrompt = () => {
  prompts.value.push({
    role: 'user',
    content: ''
  })
}

// 删除Prompt
const removePrompt = (index: number) => {
  prompts.value.splice(index, 1)
  // 确保至少保留一个编辑器
  if (prompts.value.length === 0) {
    prompts.value.push({
      role: 'system',
      content: ''
    })
  }
}

// 提交处理
const handleSubmit = () => {
  // 过滤掉空内容的prompt
  const validPrompts = prompts.value.filter(p => p.content.trim())
  console.log('提交的Prompts：', validPrompts)
}
</script>

<style>
/* 确保 Monaco 编辑器填充整个容器 */
.monaco-editor {
  height: 100% !important;
}

/* Markdown 样式 */
.prose pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0;
  margin: 1rem 0;
  overflow-x: auto;
}

.prose code {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 0;
  font-size: 0.9em;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.prose th,
.prose td {
  border: 2px dashed #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.prose th {
  background-color: #f9fafb;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  border-bottom: 2px dashed #e5e7eb;
  padding-bottom: 0.5rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

/* 编辑器容器样式 */
.monaco-editor {
  height: 100% !important;
}

/* 下拉框样式 */
select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>
