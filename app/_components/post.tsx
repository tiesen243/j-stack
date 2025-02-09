'use client'

import type { Post } from '@prisma/client'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { XIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { CreatePostSchema } from '@/validators/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/client'
import { createPostSchema } from '@/validators/post'

export const PostList: React.FC = () => {
  const { data } = useSuspenseQuery({
    queryKey: ['post', 'all'],
    queryFn: async () => {
      const res = await api.post.getAll.$get()
      return await res.json()
    },
  })

  return (
    <div className="grid gap-4">
      {data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const queryClient = useQueryClient()

  const deletePost = useMutation({
    mutationKey: ['post', 'delete'],
    mutationFn: () => api.post.delete.$post({ id: post.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', 'all'] }),
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="bg-card text-card-foreground relative flex flex-col space-y-1.5 rounded-xl border p-6 shadow">
      <h3 className="leading-none font-semibold tracking-tight">{post.title}</h3>
      <p className="text-muted-foreground text-sm">{post.content}</p>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => {
          deletePost.mutate()
        }}
        disabled={deletePost.isPending}
      >
        <XIcon />
      </Button>
    </div>
  )
}

export const PostCardSkeleton: React.FC = () => (
  <div className="bg-card text-card-foreground relative flex flex-col space-y-1.5 rounded-xl border p-6 shadow">
    <h3 className="w-1/2 animate-pulse rounded-md bg-current leading-none font-semibold tracking-tight">
      &nbsp;
    </h3>
    <p className="text-muted-foreground w-2/3 animate-pulse rounded-md bg-current text-sm">
      &nbsp;
    </p>
    <Button variant="ghost" size="icon" className="absolute top-2 right-2" disabled>
      <XIcon />
    </Button>
  </div>
)

export const CreatePostForm: React.FC = () => {
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      title: '',
      content: '',
    } satisfies CreatePostSchema,
    validators: { onChange: createPostSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await api.post.create.$post(value)
        await queryClient.invalidateQueries({
          queryKey: ['post', 'all'],
        })
      } catch (e) {
        if (e instanceof Error) toast.error(e.message)
      } finally {
        formApi.reset()
      }
    },
  })

  return (
    <form className="flex w-full max-w-2xl flex-col gap-4" action={form.handleSubmit}>
      {(['title', 'content'] as const).map((f) => (
        <form.Field key={f} name={f}>
          {(field) => (
            <div>
              <Input
                id={field.name}
                name={field.name}
                placeholder={`Enter ${field.name}`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                }}
              />

              {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <small className="text-destructive">
                  {field.state.meta.errors.join(',')}
                </small>
              ) : null}
            </div>
          )}
        </form.Field>
      ))}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isPending]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
