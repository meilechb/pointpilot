import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  const category = request.nextUrl.searchParams.get('category')

  try {
    const supabase = await createServerSupabase()

    if (slug) {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      return NextResponse.json(data)
    }

    let query = supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
