<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getComments, addComment, addReaction, getDiscussionId } from '../services/github'
import type { Comment } from '../services/github'
import MonacoEditor from './MonacoEditor.vue'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  discussionId: number
}>()

const md = new MarkdownIt()
const comments = ref<Comment[]>([])
const showComments = ref(false)
const newComment = ref('')
const replyTo = ref<Comment | null>(null)
const replyContent = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const discussionNodeId = ref<string>('')

const reactions = [
  { emoji: '👍', content: 'THUMBS_UP' },
  { emoji: '👎', content: 'THUMBS_DOWN' },
  { emoji: '😄', content: 'LAUGH' },
  { emoji: '🎉', content: 'HOORAY' },
  { emoji: '😕', content: 'CONFUSED' },
  { emoji: '❤️', content: 'HEART' },
  { emoji: '🚀', content: 'ROCKET' },
  { emoji: '👀', content: 'EYES' },
]

onMounted(async () => {
  try {
    // 获取 discussion 的 node ID
    discussionNodeId.value = await getDiscussionId(props.discussionId)
    await loadComments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  }
})

async function loadComments() {
  try {
    loading.value = true
    comments.value = await getComments(props.discussionId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载评论失败'
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!newComment.value.trim() || !discussionNodeId.value) return
  
  try {
    loading.value = true
    await addComment(discussionNodeId.value, newComment.value)
    newComment.value = ''
    await loadComments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发表评论失败'
  } finally {
    loading.value = false
  }
}

async function submitReply() {
  if (!replyTo.value || !replyContent.value.trim() || !discussionNodeId.value) return
  
  try {
    loading.value = true
    await addComment(discussionNodeId.value, replyContent.value, replyTo.value.id)
    replyTo.value = null
    replyContent.value = ''
    await loadComments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '回复评论失败'
  } finally {
    loading.value = false
  }
}

async function handleReaction(commentId: string, content: string) {
  try {
    loading.value = true
    await addReaction(commentId, content)
    await loadComments()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '添加反应失败'
  } finally {
    loading.value = false
  }
}

function startReply(comment: Comment) {
  replyTo.value = comment
  replyContent.value = ''
}
</script>

<template>
  <!-- 评论按钮 -->
  <button 
    @click="showComments = true"
    class="fixed bottom-5 right-5 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-dashed hover:bg-[#e5e7eb] bg-white"
  >
    评论 ({{ comments.length }})
  </button>

  <!-- 评论面板 -->
  <div v-if="showComments" 
       class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-2 sm:p-0">
    <div class="bg-white w-full sm:w-[800px] h-[90vh] sm:h-[600px] border-2 border-dashed flex flex-col">
      <!-- 评论区头部 -->
      <div class="p-3 sm:p-4 border-b-2 border-dashed flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-base sm:text-lg font-medium">评论区</h2>
          <span class="text-xs sm:text-sm text-gray-500">({{ comments.length }})</span>
          <span v-if="loading" class="text-xs sm:text-sm text-gray-500">加载中...</span>
          <span v-if="error" class="text-xs sm:text-sm text-red-500">{{ error }}</span>
        </div>
        <button 
          @click="showComments = false"
          class="px-2 sm:px-3 py-1 text-sm border-2 border-dashed hover:bg-[#e5e7eb]">
          关闭
        </button>
      </div>

      <!-- 评论列表 -->
      <div class="flex-1 overflow-auto">
        <div class="divide-y-2 divide-dashed">
          <!-- 评论输入框 -->
          <div class="p-3 sm:p-4">
            <div class="border-2 border-dashed">
              <MonacoEditor
                v-model="newComment"
                language="markdown"
                :options="{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  fontSize: 14,
                  lineHeight: 20
                }"
                class="h-[100px]"
              />
            </div>
            <div class="flex justify-end mt-2">
              <button 
                @click="submitComment"
                :disabled="!newComment.trim() || loading"
                class="px-3 sm:px-4 py-2 text-sm border-2 border-dashed hover:bg-[#e5e7eb] disabled:opacity-50">
                {{ loading ? '发表中...' : '发表评论' }}
              </button>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div v-for="comment in comments" 
                :key="comment.id"
                class="border-2 border-dashed p-3 sm:p-4">
              <!-- 评论头部 -->
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-sm">{{ comment.author.login }}</span>
                  <span class="text-xs text-gray-500">
                    {{ new Date(comment.createdAt).toLocaleString() }}
                  </span>
                  <span v-if="comment.replyTo" class="text-xs text-gray-500">
                    回复 @{{ comment.replyTo.author.login }}
                  </span>
                </div>
                <button 
                  @click="startReply(comment)"
                  class="text-xs sm:text-sm text-gray-500 hover:text-gray-700">
                  回复
                </button>
              </div>

              <!-- 评论内容 -->
              <div class="prose prose-sm max-w-none mb-2 text-sm" v-html="md.render(comment.body)"></div>

              <!-- 反应按钮 -->
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="reaction in reactions"
                  :key="reaction.content"
                  @click="handleReaction(comment.id, reaction.content)"
                  :disabled="loading"
                  class="px-2 py-1 text-xs sm:text-sm border-2 border-dashed hover:bg-[#e5e7eb] disabled:opacity-50">
                  {{ reaction.emoji }} {{ 
                    comment.reactions.nodes.filter(r => r.content === reaction.content).length 
                  }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 回复对话框 -->
    <div v-if="replyTo" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-0">
      <div class="bg-white p-3 sm:p-4 w-full sm:w-[600px] border-2 border-dashed">
        <div class="mb-4 text-sm">
          回复 @{{ replyTo.author.login }}
        </div>
        <div class="border-2 border-dashed">
          <MonacoEditor
            v-model="replyContent"
            language="markdown"
            :options="{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'off',
              fontSize: 14,
              lineHeight: 20
            }"
            class="h-[100px]"
          />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button 
            @click="replyTo = null"
            class="px-3 sm:px-4 py-2 text-sm border-2 border-dashed hover:bg-[#e5e7eb]">
            取消
          </button>
          <button 
            @click="submitReply"
            :disabled="!replyContent.trim() || loading"
            class="px-3 sm:px-4 py-2 text-sm border-2 border-dashed hover:bg-[#e5e7eb] disabled:opacity-50">
            {{ loading ? '回复中...' : '回复' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
