<template>
  <div class="flex items-center justify-center h-full">
    <div class="text-gray-600">登录中...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { handleGithubCallback } from '../auth/login'

const router = useRouter()

onMounted(async () => {
  try {
    await handleGithubCallback()
    // 登录成功后，使用 replace 而不是 push，并强制刷新
    window.location.href = '/'
  } catch (error) {
    console.error('登录失败:', error)
    router.push('/')
  }
})
</script>