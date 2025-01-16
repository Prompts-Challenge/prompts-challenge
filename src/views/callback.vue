<script setup lang="ts">
import { handleGithubCallback } from '../auth/login';
import { useRouter, useRoute } from 'vue-router';

// 将 router 和 route 移到顶层
const router = useRouter();
const route = useRoute();

const handleAuth = async () => {
  try {
    await handleGithubCallback();
    const returnPath = route.query.state?.toString() || '/';
    console.log(returnPath);
    router.push(returnPath);
  } catch (error) {
    console.error('Auth failed:', error);
    router.push('/login?error=auth_failed');
  }
};

handleAuth();
</script>

<template>
  <div class="w-full h-full flex justify-center items-center">
    <span class="font-mono text-sm">Callbacking to homepage...</span>
  </div>
</template>
