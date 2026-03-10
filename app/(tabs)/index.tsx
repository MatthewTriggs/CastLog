import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const SPECIES_EMOJI: Record<string, string> = {
  Yellowfish: '🐟', Snoek: '🦈', Bass: '🎣', Trout: '🐠',
  Tigerfish: '🐡', Carp: '🐟', Kob: '🌊', Other: '⚓',
};

async function sendFollowNotif(userId: string, username: string) {
  if (Platform.OS === 'web') return;
  const { sendFollowNotification } = await import('../../lib/notifications');
  await sendFollowNotification(userId, username);
}

async function sendLikeNotif(ownerId: string, username: string) {
  if (Platform.OS === 'web') return;
  const { sendLikeNotification } = await import('../../lib/notifications');
  await sendLikeNotification(ownerId, username);
}

async function sendCommentNotif(ownerId: string, username: string) {
  if (Platform.OS === 'web') return;
  const { sendCommentNotification } = await import('../../lib/notifications');
  await sendCommentNotification(ownerId, username);
}

export default function Feed() {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      setCurrentUsername(profile?.username || user.email?.split('@')[0] || 'Angler');
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      if (followData) setFollowing(new Set(followData.map((f: any) => f.following_id)));
    }
    await loadCatches();
  }

  async function loadCatches() {
    const { data, error } = await supabase
      .from('catches')
      .select('*, profiles(username, id), comments(id)')
      .order('created_at', { ascending: false });
    if (!error && data) setCatches(data);
    setLoading(false);
    setRefreshing(false);
  }

  async function loadComments(catchId: string) {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('catch_id', catchId)
      .order('created_at', { ascending: true });
    if (data) setComments(prev => ({ ...prev, [catchId]: data }));
  }

  async function toggleComments(catchId: string) {
    const isOpen = showComments.has(catchId);
    if (!isOpen) {
      try {
        await loadComments(catchId);
      } catch {
        setComments(prev => ({ ...prev, [catchId]: [] }));
      }
    }
    setShowComments(prev => {
      const next = new Set(prev);
      isOpen ? next.delete(catchId) : next.add(catchId);
      return next;
    });
  }

  async function submitComment(catchId: string) {
    const text = commentText[catchId]?.trim();
    if (!text || !currentUserId) return;
    setSubmitting(catchId);

    const newComment = {
      id: Date.now().toString(),
      catch_id: catchId,
      user_id: currentUserId,
      text,
      profiles: { username: currentUsername },
      created_at: new Date().toISOString(),
    };

    setComments(prev => ({
      ...prev,
      [catchId]: [...(prev[catchId] || []), newComment],
    }));
    setCommentText(prev => ({ ...prev, [catchId]: '' }));

    const { error: insertError } = await supabase.from('comments').insert({
      catch_id: catchId,
      user_id: currentUserId,
      text,
    });

    if (!insertError) {
      const catchObj = catches.find(c => c.id === catchId);
      if (catchObj && catchObj.user_id !== currentUserId) {
        await sendCommentNotif(catchObj.user_id, currentUsername);
      }
      // Update the comment count in catches state
      setCatches(prev => prev.map(c => c.id === catchId
        ? { ...c, comments: [...(c.comments || []), { id: Date.now().toString() }] }
        : c
      ));
    }

    await loadComments(catchId);
    setSubmitting(null);
  }

  async function toggleFollow(userId: string) {
    if (userId === currentUserId) return;
    const isFollowing = following.has(userId);
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);
      setFollowing(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
      setFollowing(prev => new Set(prev).add(userId));
      await sendFollowNotif(userId, currentUsername);
    }
  }

  async function toggleLike(catchId: string, catchOwnerId: string) {
    const isLiked = liked.has(catchId);
    if (isLiked) {
      setLiked(prev => { const next = new Set(prev); next.delete(catchId); return next; });
    } else {
      setLiked(prev => new Set(prev).add(catchId));
      if (catchOwnerId !== currentUserId) {
        await sendLikeNotif(catchOwnerId, currentUsername);
      }
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>CAST<Text style={styles.logoAccent}>LOG</Text></Text>
      </View>

      <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/modal')}>
        <Text style={styles.logBtnText}>🎣 LOG A CATCH</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#e8a830" size="large" />
        </View>
      ) : catches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎣</Text>
          <Text style={styles.emptyTitle}>No catches yet!</Text>
          <Text style={styles.emptySub}>Be the first to log a catch.</Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#e8a830" />}>
          {catches.map((c) => (
            <View key={c.id} style={styles.post}>
              <View style={styles.postHeader}>
                <TouchableOpacity onPress={() => router.push(`/user/${c.user_id}`)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{SPECIES_EMOJI[c.species] || '🎣'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/user/${c.user_id}`)}>
                  <Text style={styles.username}>{c.profiles?.username || 'Angler'}</Text>
                  <Text style={styles.location}>📍 {c.location || 'Unknown spot'}</Text>
                </TouchableOpacity>
                {c.user_id !== currentUserId && (
                  <TouchableOpacity
                    onPress={() => toggleFollow(c.user_id)}
                    style={[styles.followBtn, following.has(c.user_id) && styles.followingBtn]}>
                    <Text style={[styles.followBtnText, following.has(c.user_id) && styles.followingBtnText]}>
                      {following.has(c.user_id) ? 'Following' : '+ Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {c.photo_url ? (
                <Image source={{ uri: c.photo_url }} style={styles.catchPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.catchCard}>
                  <Text style={styles.fishEmoji}>{SPECIES_EMOJI[c.species] || '🎣'}</Text>
                </View>
              )}

              <View style={styles.catchStats}>
                {c.weight_kg && <View style={styles.statPill}><Text style={styles.statText}>📏 {c.weight_kg} kg</Text></View>}
                {c.length_cm && <View style={styles.statPill}><Text style={styles.statText}>↕ {c.length_cm} cm</Text></View>}
                {c.bait && <View style={styles.statPill}><Text style={styles.statText}>🪝 {c.bait}</Text></View>}
              </View>

              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => toggleLike(c.id, c.user_id)}>
                  <Text style={[styles.actionBtn, liked.has(c.id) && styles.actionBtnLiked]}>
                    {liked.has(c.id) ? '❤️ Liked' : '🤍 Like'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleComments(c.id)}>
                  <Text style={[styles.actionBtn, showComments.has(c.id) && styles.actionBtnActive]}>
                    💬 {comments[c.id]?.length ? `${comments[c.id].length}` : c.comments?.length ? `${c.comments.length}` : 'Comment'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.actionBtn}>↗️ Share</Text>
              </View>

              {c.notes ? (
                <Text style={styles.caption}><Text style={styles.bold}>{c.profiles?.username || 'Angler'} </Text>{c.notes}</Text>
              ) : null}
              <Text style={styles.time}>{timeAgo(c.created_at)}</Text>

              {showComments.has(c.id) && (
                <View style={styles.commentsSection}>
                  {(comments[c.id] || []).map((comment: any) => (
                    <View key={comment.id} style={styles.commentRow}>
                      <Text style={styles.commentUsername}>{comment.profiles?.username || 'Angler'} </Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  ))}
                  {(comments[c.id] || []).length === 0 && (
                    <Text style={styles.noComments}>No comments yet — be the first!</Text>
                  )}
                  <View style={styles.commentInput}>
                    <TextInput
                      style={styles.commentBox}
                      placeholder="Add a comment..."
                      placeholderTextColor="#4a8b63"
                      value={commentText[c.id] || ''}
                      onChangeText={t => setCommentText(prev => ({ ...prev, [c.id]: t }))}
                      onSubmitEditing={() => submitComment(c.id)}
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      style={styles.commentSendBtn}
                      onPress={() => submitComment(c.id)}
                      disabled={submitting === c.id}>
                      <Text style={styles.commentSendText}>
                        {submitting === c.id ? '...' : '➤'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b14' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a2e22' },
  logo: { fontSize: 28, fontWeight: '900', color: '#e8a830', letterSpacing: 3 },
  logoAccent: { color: '#7fb89a' },
  logBtn: { backgroundColor: '#e8a830', margin: 16, borderRadius: 14, padding: 14, alignItems: 'center' },
  logBtnText: { color: '#0d1b14', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#e8a830', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#8a9490', marginTop: 8 },
  post: { borderBottomWidth: 1, borderBottomColor: '#151f19' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a3528', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2d5a40' },
  avatarText: { fontSize: 20 },
  username: { color: '#fafaf8', fontWeight: '700', fontSize: 14 },
  bold: { fontWeight: '700', color: '#fafaf8' },
  location: { color: '#4a8b63', fontSize: 11, marginTop: 1 },
  catchCard: { width: '100%', height: 240, backgroundColor: '#1a3528', alignItems: 'center', justifyContent: 'center' },
  catchPhoto: { width: '100%', height: 280 },
  fishEmoji: { fontSize: 80 },
  catchStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  statPill: { backgroundColor: 'rgba(13,27,20,0.85)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,139,99,0.3)' },
  statText: { color: '#b8ddc8', fontSize: 11, fontWeight: '600' },
  postActions: { flexDirection: 'row', padding: 10, gap: 16 },
  actionBtn: { color: '#8a9490', fontSize: 13, fontWeight: '500' },
  actionBtnLiked: { color: '#e8a830' },
  actionBtnActive: { color: '#7fb89a' },
  caption: { color: '#e8ede9', fontSize: 13, paddingHorizontal: 12, paddingBottom: 4, lineHeight: 20 },
  time: { color: '#8a9490', fontSize: 11, paddingHorizontal: 12, paddingBottom: 12 },
  followBtn: { backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2d5a40', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  followingBtn: { backgroundColor: 'transparent', borderColor: '#4a8b63' },
  followBtnText: { color: '#e8a830', fontSize: 12, fontWeight: '700' },
  followingBtnText: { color: '#4a8b63' },
  commentsSection: { backgroundColor: '#0f1a12', borderTopWidth: 1, borderTopColor: '#1a2e22', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  commentUsername: { color: '#e8a830', fontWeight: '700', fontSize: 13 },
  commentText: { color: '#e8ede9', fontSize: 13, flex: 1 },
  noComments: { color: '#4a8b63', fontSize: 12, fontStyle: 'italic', paddingVertical: 4 },
  commentInput: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  commentBox: { flex: 1, backgroundColor: '#1a2e22', borderWidth: 1, borderColor: '#2d5a40', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#fafaf8', fontSize: 13 },
  commentSendBtn: { backgroundColor: '#e8a830', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentSendText: { color: '#0d1b14', fontWeight: '900', fontSize: 14 },
});
