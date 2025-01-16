import { Octokit } from '@octokit/rest'
import { parse as parseYaml } from 'yaml'

const OWNER = 'Prompts-Challenge'
const REPO = 'question-bank'

interface QuestionMetadata {
  description?: string
  difficulty?: string
  [key: string]: any
}

export interface Question {
  id: number
  title: string
  body: string
  description: string
  metadata: QuestionMetadata
  tags: string[]
  author: {
    login: string
    avatar_url: string
  }
  createdAt: string
  comments: number
  reactions: {
    totalCount: number
    [key: string]: number | undefined
  }
}

export interface Comment {
  id: string
  author: {
    login: string
    avatar_url: string
  }
  body: string
  createdAt: string
  reactions: {
    totalCount: number
    nodes: Array<{
      content: string
      user: {
        login: string
      }
    }>
  }
  replyTo?: {
    id: string
    author: {
      login: string
    }
  }
}

export interface QuestionListItem {
  number: number
  title: string
  author: {
    login: string
    avatar_url: string
  }
  createdAt: string
  comments: number
  reactions: {
    totalCount: number
  }
  labels: string[]
  metadata: {
    description?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    [key: string]: any
  }
}

function extractYamlAndContent(markdown: string): { metadata: QuestionMetadata; content: string } {
  const yamlRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/
  const match = markdown.match(yamlRegex)

  if (match) {
    try {
      const yaml = parseYaml(match[1].trim()) as QuestionMetadata
      return {
        metadata: yaml,
        content: match[2].trim()
      }
    } catch (e) {
      console.error('YAML parsing error:', e)
    }
  }

  return {
    metadata: {},
    content: markdown.trim()
  }
}

export async function getQuestion(discussionId: number): Promise<Question> {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  // GraphQL query to get discussion details
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          title
          body
          labels(first: 10) {
            nodes {
              name
            }
          }
          author {
            login
            avatarUrl
          }
          createdAt
          comments {
            totalCount
          }
          reactions {
            totalCount
          }
        }
      }
    }
  `

  const response = await octokit.graphql(query, {
    owner: OWNER,
    repo: REPO,
    number: discussionId
  })

  const discussion = (response as any).repository.discussion
  const { metadata, content } = extractYamlAndContent(discussion.body)
  
  return {
    id: discussionId,
    title: discussion.title,
    body: content,
    description: metadata.description || '',
    metadata,
    tags: discussion.labels.nodes.map((label: any) => label.name),
    author: {
      login: discussion.author.login,
      avatar_url: discussion.author.avatarUrl
    },
    createdAt: discussion.createdAt,
    comments: discussion.comments.totalCount,
    reactions: {
      totalCount: discussion.reactions.totalCount
    }
  }
}

export async function getComments(discussionId: number): Promise<Comment[]> {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          comments(first: 100) {
            nodes {
              id
              author {
                login
                avatarUrl
              }
              body
              createdAt
              reactions(first: 100) {
                totalCount
                nodes {
                  content
                  user {
                    login
                  }
                }
              }
              replyTo {
                id
                author {
                  login
                }
              }
            }
          }
        }
      }
    }
  `

  const response = await octokit.graphql(query, {
    owner: OWNER,
    repo: REPO,
    number: discussionId
  })

  return (response as any).repository.discussion.comments.nodes.map((comment: any) => ({
    id: comment.id,
    author: {
      login: comment.author.login,
      avatar_url: comment.author.avatarUrl
    },
    body: comment.body,
    createdAt: comment.createdAt,
    reactions: comment.reactions,
    replyTo: comment.replyTo
  }))
}

export async function addComment(discussionNodeId: string, body: string, replyToId?: string) {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  const mutation = `
    mutation($discussionId: ID!, $body: String!, $replyToId: ID) {
      addDiscussionComment(input: {
        discussionId: $discussionId,
        body: $body,
        replyToId: $replyToId
      }) {
        comment {
          id
        }
      }
    }
  `

  return await octokit.graphql(mutation, {
    discussionId: discussionNodeId,
    body,
    replyToId
  })
}

export async function addReaction(subjectId: string, content: string) {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  const mutation = `
    mutation($subjectId: ID!, $content: ReactionContent!) {
      addReaction(input: {
        subjectId: $subjectId,
        content: $content
      }) {
        reaction {
          content
        }
      }
    }
  `

  return await octokit.graphql(mutation, {
    subjectId,
    content
  })
}

export async function getDiscussionId(number: number): Promise<string> {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
        }
      }
    }
  `

  const response = await octokit.graphql(query, {
    owner: OWNER,
    repo: REPO,
    number
  })

  return (response as any).repository.discussion.id
}

export async function getQuestionList(cursor?: string): Promise<{
  questions: QuestionListItem[]
  hasNextPage: boolean
  endCursor: string | null
}> {
  const token = localStorage.getItem('github_token')
  if (!token) throw new Error('Not authenticated')

  const octokit = new Octokit({ auth: token })

  const query = `
    query($owner: String!, $repo: String!, $after: String) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 10, after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            number
            title
            body
            createdAt
            author {
              login
              avatarUrl
            }
            comments {
              totalCount
            }
            reactions {
              totalCount
            }
            labels(first: 10) {
              nodes {
                name
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const response = await octokit.graphql(query, {
    owner: OWNER,
    repo: REPO,
    after: cursor
  })

  const discussions = (response as any).repository.discussions
  const pageInfo = discussions.pageInfo

  const questions = discussions.nodes.map((node: any) => {
    const { metadata } = extractYamlAndContent(node.body)
    return {
      number: node.number,
      title: node.title,
      author: {
        login: node.author.login,
        avatar_url: node.author.avatarUrl
      },
      createdAt: node.createdAt,
      comments: node.comments.totalCount,
      reactions: {
        totalCount: node.reactions.totalCount
      },
      labels: node.labels.nodes.map((label: any) => label.name),
      metadata
    }
  })

  return {
    questions,
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor
  }
} 