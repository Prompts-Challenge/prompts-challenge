<template>
  <div class="w-full h-full overflow-auto p-2 sm:p-5">
    <!-- 顶部统计卡片 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-5 mb-2 sm:mb-5">
      <div v-for="stat in stats" 
           :key="stat.title" 
           class="border-2 border-dashed p-3 sm:p-4">
        <div class="text-center">
          <div class="text-xs sm:text-sm text-gray-600">{{ stat.title }}</div>
          <div class="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{{ stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-5">
      <!-- 左侧：问题列表 (占据全部/2列) -->
      <div class="lg:col-span-2">
        <div class="border-2 border-dashed">
          <div class="p-3 sm:p-4 border-b-2 border-dashed">
            <h2 class="text-base sm:text-lg font-medium">Prompt 挑战</h2>
          </div>
          
          <!-- 选项卡 -->
          <div class="border-b-2 border-dashed">
            <div class="flex">
              <button 
                @click="activeTab = 'single'"
                :class="[
                  'px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-[#e5e7eb]',
                  activeTab === 'single' ? 'bg-[#e5e7eb]' : ''
                ]">
                单轮对话
              </button>
              <button 
                class="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-400 cursor-not-allowed"
                disabled>
                工作流
              </button>
            </div>
          </div>

          <!-- 移动端列表视图 -->
          <div class="block lg:hidden">
            <div class="divide-y-2 divide-dashed">
              <div v-for="problem in problems" 
                   :key="problem.number"
                   class="p-3 hover:bg-[#e5e7eb] cursor-pointer"
                   @click="router.push(`/question/${problem.number}`)">
                <div class="flex items-center justify-between mb-1">
                  <span class="px-2 py-0.5 text-xs" 
                        :class="problem.status === '未完成' ? 'text-gray-600' : 'text-green-600'">
                    {{ problem.status }}
                  </span>
                  <span :class="{
                    'text-xs px-2 py-0.5': true,
                    'text-green-600': problem.metadata?.difficulty === 'easy',
                    'text-yellow-600': problem.metadata?.difficulty === 'medium',
                    'text-red-600': problem.metadata?.difficulty === 'hard'
                  }">{{ getDifficultyText(problem.metadata?.difficulty) }}</span>
                </div>
                <div class="font-medium text-blue-600">{{ problem.title }}</div>
                <div class="flex justify-between mt-1 text-xs text-gray-500">
                  <span>通过率: {{ problem.passRate || 'N/A' }}</span>
                  <span>提交: {{ problem.comments }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 桌面端表格视图 -->
          <div class="hidden lg:block">
            <div class="p-4">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-dashed">
                    <th v-for="col in columns" 
                        :key="col.key"
                        :style="{ width: col.width + 'px' }"
                        class="text-left py-2 px-4 text-sm font-medium text-gray-600">
                      {{ col.title }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="problem in problems" 
                      :key="problem.number"
                      class="border-b-2 border-dashed hover:bg-[#e5e7eb] cursor-pointer"
                      @click="router.push(`/question/${problem.number}`)">
                    <td class="py-3 px-4">
                      <span class="px-2 py-1" 
                            :class="problem.status === '未完成' ? 'text-gray-600' : 'text-green-600'">
                        {{ problem.status }}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <a class="text-blue-600 hover:text-blue-800">{{ problem.title }}</a>
                    </td>
                    <td class="py-3 px-4">
                      <span :class="{
                        'text-green-600': problem.metadata?.difficulty === 'easy',
                        'text-yellow-600': problem.metadata?.difficulty === 'medium',
                        'text-red-600': problem.metadata?.difficulty === 'hard'
                      }">{{ getDifficultyText(problem.metadata?.difficulty) }}</span>
                    </td>
                    <td class="py-3 px-4">{{ problem.passRate || 'N/A' }}</td>
                    <td class="py-3 px-4">{{ problem.comments }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasNextPage" class="flex justify-center mt-4">
            <button 
              @click="loadMore"
              :disabled="loading"
              class="px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-dashed hover:bg-[#e5e7eb] disabled:opacity-50">
              {{ loading ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：排行榜和活动 -->
      <div class="flex flex-col gap-2 sm:gap-5">
        <!-- 排行榜 -->
        <div class="border-2 border-dashed flex-1">
          <div class="p-3 sm:p-4 border-b-2 border-dashed">
            <h2 class="text-base sm:text-lg font-medium">排行榜</h2>
          </div>
          <div class="p-3 sm:p-4">
            <div class="h-40 flex items-center justify-center text-gray-400">
              排行榜组件占位
            </div>
          </div>
        </div>

        <!-- 最新活动 -->
        <div class="border-2 border-dashed flex-1">
          <div class="p-3 sm:p-4 border-b-2 border-dashed">
            <h2 class="text-base sm:text-lg font-medium">近期活动</h2>
          </div>
          <div class="p-3 sm:p-4">
            <div class="space-y-3 sm:space-y-4">
              <div v-for="activity in activities" 
                   :key="activity.id" 
                   class="relative pl-4 border-l-2 border-dashed pb-3 sm:pb-4 hover:bg-[#e5e7eb]">
                <div class="absolute -left-[5px] top-[6px] w-2 h-2 bg-gray-400"></div>
                <div class="text-xs sm:text-sm font-medium">{{ activity.title }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ activity.time }}</div>
                <div class="text-xs sm:text-sm text-gray-600 mt-1">{{ activity.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getQuestionList } from '../services/github'
import type { QuestionListItem } from '../services/github'

const router = useRouter()
const activeTab = ref('single')
const loading = ref(false)
const hasNextPage = ref(false)
const endCursor = ref<string | null>(null)
const problems = ref<QuestionListItem[]>([])

// 顶部统计数据
const stats = ref([
  { title: '已完成挑战', value: '0' },
  { title: '总排名', value: 'N/A' },
  { title: '连续提交', value: '0' },
  { title: '获得点赞', value: '0' }
])

// 问题列表列定义
const columns = [
  { title: '状态', key: 'status', width: 80 },
  { title: '标题', key: 'title', width: 300 },
  { title: '难度', key: 'difficulty', width: 100 },
  { title: '通过率', key: 'passRate', width: 100 },
  { title: '提交次数', key: 'submissions', width: 100 }
]

// 活动数据
const activities = ref([
  {
    id: 1,
    title: '新手任务上线',
    time: '2024-03-20',
    content: '完成首个Prompt挑战即可获得积分奖励'
  },
  {
    id: 2,
    title: '每周竞赛',
    time: '2024-03-18',
    content: '本周主题：电商场景对话优化'
  }
])

const getDifficultyText = (difficulty?: string) => {
  switch (difficulty) {
    case 'easy':
      return '简单'
    case 'medium':
      return '中等'
    case 'hard':
      return '困难'
    default:
      return 'N/A'
  }
}

async function loadQuestions(cursor?: string) {
  try {
    loading.value = true
    const data = await getQuestionList(cursor)
    
    if (cursor) {
      problems.value.push(...data.questions)
    } else {
      problems.value = data.questions
    }
    
    hasNextPage.value = data.hasNextPage
    endCursor.value = data.endCursor
  } catch (e) {
    console.error('加载题目失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (hasNextPage.value && endCursor.value) {
    await loadQuestions(endCursor.value)
  }
}

onMounted(() => {
  loadQuestions()
})
</script>