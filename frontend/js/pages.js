async function loadFavorites() {
  const target = document.querySelector('#favorite-list');
  if (!target) return;
  if (!getToken()) { target.innerHTML = '<p class="empty">กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด <a href="login.html">เข้าสู่ระบบ</a></p>'; return; }
  try {
    const data = await api('/api/favorites');
    target.innerHTML = data.reviews.length ? data.reviews.map(reviewCard).join('') : '<p class="empty">ยังไม่มีรายการโปรด</p>';
  } catch (error) { target.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}

async function loadComments(reviewId) {
  const target = document.querySelector('#comments-list');
  if (!target) return;
  try {
    const data = await api(`/api/reviews/${reviewId}/comments`);
    target.innerHTML = data.comments.length ? data.comments.map((comment) => `<div class="comment-item"><strong>${escapeHtml(comment.author)}</strong><small>${formatDate(comment.created_at)}</small><p>${escapeHtml(comment.comment_text)}</p>${Number(getUser()?.id) === Number(comment.user_id) || getUser()?.role === 'admin' ? `<button class="text-danger" data-delete-comment="${comment.id}">ลบความคิดเห็น</button>` : ''}</div>`).join('') : '<p class="form-note">ยังไม่มีความคิดเห็น</p>';
  } catch (error) { target.innerHTML = `<p class="form-note">${escapeHtml(error.message)}</p>`; }
}

async function loadReviewDetail() {
  const target = document.querySelector('#review-detail');
  if (!target) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { target.innerHTML = '<p class="empty">ไม่พบรหัสรีวิว</p>'; return; }
  try {
    const data = await api(`/api/reviews/${encodeURIComponent(id)}`);
    const review = data.review;
    const user = getUser();
    const canManage = user && (Number(user.id) === Number(review.user_id) || user.role === 'admin');
    target.innerHTML = `<div class="detail-layout"><div class="detail-photo"><img src="${escapeHtml(review.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000')}" alt="${escapeHtml(review.title)}"></div>
      <div class="detail-copy"><div class="eyebrow">${escapeHtml(review.category || 'FOOD JOURNAL')}</div><h1>${escapeHtml(review.title)}</h1>
      <div class="stars">${renderStars(review.rating)}</div><p>📍 ${escapeHtml(review.restaurant)} · ${escapeHtml(review.location || 'ไม่ระบุพิกัด')}</p>
      <p>${escapeHtml(review.body).replace(/\n/g, '<br>')}</p><p class="form-note">รีวิวโดย ${escapeHtml(review.author)} · ${formatDate(review.created_at)} · ${review.view_count} ครั้งที่อ่าน</p>
      <div class="detail-actions"><button class="btn btn-outline" data-like="${review.id}">♥ ถูกใจ (${review.like_count || 0})</button><button class="btn btn-outline" data-favorite="${review.id}">${review.favorited ? '★ บันทึกแล้ว' : '☆ บันทึกรายการโปรด'}</button>
      ${canManage ? `<a class="btn btn-outline" href="edit-review.html?id=${review.id}">แก้ไขรีวิว</a><button class="btn btn-danger" id="delete-review">ลบรีวิว</button>` : ''}</div></div></div>
      <section class="comments-section"><h2>ความคิดเห็น</h2><form id="comment-form" class="comment-form"><textarea class="field" name="comment" rows="3" maxlength="1000" placeholder="แบ่งปันความคิดเห็นของคุณ..." required></textarea><button class="btn btn-red">ส่งความคิดเห็น</button></form><div id="comments-list"></div></section>`;
    await loadComments(id);
    document.querySelector('#comment-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!requireLogin()) return;
      try { await api(`/api/reviews/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment: new FormData(event.currentTarget).get('comment') }) }); event.currentTarget.reset(); toast('เพิ่มความคิดเห็นแล้ว'); await loadComments(id); }
      catch (error) { toast(error.message, 'error'); }
    });
    document.querySelector('#delete-review')?.addEventListener('click', async () => {
      if (!confirmAction('ยืนยันลบรีวิวนี้ใช่ไหม? การลบไม่สามารถกู้คืนได้')) return;
      try { await api(`/api/reviews/${id}`, { method: 'DELETE' }); toast('ลบรีวิวแล้ว'); location.href = 'profile.html'; }
      catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { target.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('#search-form');
  searchForm?.addEventListener('submit', (event) => { event.preventDefault(); renderCards('#review-list', searchForm.querySelector('input').value); });
  const params = new URLSearchParams(location.search);
  const category = params.get('category') || '';
  if (category && document.querySelector('#review-list')) renderCards('#review-list', '', 'latest', category);
  if (document.querySelector('#review-detail')) loadReviewDetail();
  if (document.querySelector('#favorite-list')) loadFavorites();

  const loginForm = document.querySelector('#login-form');
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try { const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) }); saveSession(data.token, data.user); location.href = 'profile.html'; }
    catch (error) { toast(error.message, 'error'); }
  });

  const registerForm = document.querySelector('#register-form');
  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(registerForm));
    if (values.password !== values.confirm) return toast('รหัสผ่านไม่ตรงกัน', 'error');
    delete values.confirm;
    try { await api('/api/auth/register', { method: 'POST', body: JSON.stringify(values) }); toast('สมัครสมาชิกสำเร็จ ไปเข้าสู่ระบบได้เลย'); setTimeout(() => location.href = 'login.html', 900); }
    catch (error) { toast(error.message, 'error'); }
  });

  const reviewForm = document.querySelector('#review-form');
  if (reviewForm) {
    let rating = 5;
    const picker = document.querySelector('#star-picker');
    const paintStars = () => { picker.innerHTML = [1, 2, 3, 4, 5].map((number) => `<button type="button" class="star-btn ${number <= rating ? 'active' : ''}" data-star="${number}">★</button>`).join(''); };
    paintStars();
    picker.addEventListener('click', (event) => { const button = event.target.closest('[data-star]'); if (button) { rating = Number(button.dataset.star); paintStars(); } });
    const editId = params.get('id');
    if (editId) {
      document.querySelector('h1').textContent = 'แก้ไขรีวิวของคุณ';
      document.querySelector('button[type="submit"], #review-form button').textContent = 'บันทึกการแก้ไข';
      api(`/api/reviews/${editId}`).then(({ review }) => {
        for (const field of ['title', 'restaurant', 'location', 'category', 'body']) { const input = reviewForm.elements[field]; if (input) input.value = review[field] || ''; }
        rating = Number(review.rating); paintStars();
      }).catch((error) => toast(error.message, 'error'));
    }
    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!requireLogin()) return;
      const formData = new FormData(reviewForm); formData.set('rating', rating);
      try {
        const result = await api(editId ? `/api/reviews/${editId}` : '/api/reviews', { method: editId ? 'PATCH' : 'POST', body: formData });
        toast(result.message || 'บันทึกสำเร็จ');
        setTimeout(() => location.href = editId ? `review.html?id=${editId}` : `review.html?id=${result.id}`, 700);
      } catch (error) { toast(error.message, 'error'); }
    });
  }

  const profile = document.querySelector('#profile-content');
  if (profile) loadProfile();
  if (document.querySelector('#admin-summary')) loadAdminDashboard();

  const contactForm = document.querySelector('#contact-form');
  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try { const result = await api('/api/contact', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(contactForm))) }); toast(result.message); contactForm.reset(); }
    catch (error) { toast(error.message, 'error'); }
  });

  document.addEventListener('click', async (event) => {
    const deleteComment = event.target.closest('[data-delete-comment]');
    if (!deleteComment) return;
    if (!confirmAction('ยืนยันลบความคิดเห็นนี้ใช่ไหม?')) return;
    try { await api(`/api/comments/${deleteComment.dataset.deleteComment}`, { method: 'DELETE' }); toast('ลบความคิดเห็นแล้ว'); await loadComments(params.get('id')); }
    catch (error) { toast(error.message, 'error'); }
  });
});

async function loadProfile() {
  const target = document.querySelector('#profile-content');
  if (!getToken()) { target.innerHTML = '<div class="empty">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ <a class="btn btn-dark" href="login.html">เข้าสู่ระบบ</a></div>'; return; }
  try {
    const { user } = await api('/api/auth/me');
    localStorage.setItem('what_to_eat_user', JSON.stringify(user));
    target.innerHTML = `<div class="profile-panel"><div class="profile-head"><div class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div><div><div class="eyebrow">WHAT TO EAT MEMBER</div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.email)}</p><span class="tag">${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</span>${user.role === 'admin' ? '<p><a class="btn btn-outline" href="admin.html">เปิดแดชบอร์ดผู้ดูแล</a></p>' : ''}</div></div>
      <form id="profile-form" class="form-wrap"><h2>แก้ไขโปรไฟล์</h2><div class="form-row"><label>ชื่อที่แสดง</label><input class="field" name="name" value="${escapeHtml(user.name)}" required minlength="2"></div><div class="form-row"><label>แนะนำตัว</label><textarea class="field" name="bio" rows="3" maxlength="500">${escapeHtml(user.bio || '')}</textarea></div><button class="btn btn-red">บันทึกโปรไฟล์</button></form>
      <form id="password-form" class="form-wrap"><h2>เปลี่ยนรหัสผ่าน</h2><div class="form-row"><label>รหัสผ่านปัจจุบัน</label><input class="field" name="currentPassword" type="password" required></div><div class="form-row"><label>รหัสผ่านใหม่</label><input class="field" name="newPassword" type="password" minlength="8" required></div><button class="btn btn-outline">เปลี่ยนรหัสผ่าน</button></form>
      <div class="danger-zone"><h2>จัดการบัญชี</h2><p>การลบบัญชีจะลบรีวิวและข้อมูลที่เกี่ยวข้องกับบัญชีนี้ด้วย และไม่สามารถกู้คืนได้</p><button id="delete-account" class="btn btn-danger">ลบบัญชีของฉัน</button></div></div>
      <h2 class="section-title">รีวิวล่าสุดจากชุมชน</h2><div class="review-grid" id="my-review-list"></div>`;
    const [myReviews] = await Promise.all([api('/api/reviews')]);
    const own = myReviews.reviews.filter((review) => Number(review.user_id) === Number(user.id));
    document.querySelector('#my-review-list').innerHTML = own.length ? own.map(reviewCard).join('') : '<p class="empty">คุณยังไม่ได้เขียนรีวิว</p>';
    document.querySelector('#profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { const result = await api('/api/auth/me', { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); localStorage.setItem(USER_KEY, JSON.stringify(result.user)); toast(result.message); renderNav(); }
      catch (error) { toast(error.message, 'error'); }
    });
    document.querySelector('#password-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await api('/api/auth/password', { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); clearSession(); toast('เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่'); setTimeout(() => location.href = 'login.html', 900); }
      catch (error) { toast(error.message, 'error'); }
    });
    document.querySelector('#delete-account').addEventListener('click', async () => {
      if (!confirmAction('คำเตือน: ต้องการลบบัญชีถาวรใช่ไหม? รีวิว ความคิดเห็น และรายการโปรดของคุณจะถูกลบด้วย')) return;
      const password = prompt('เพื่อยืนยันตัวตน กรุณากรอกรหัสผ่านปัจจุบัน:');
      if (password === null) return;
      try { const result = await api('/api/auth/me', { method: 'DELETE', body: JSON.stringify({ password }) }); clearSession(); alert(result.message); location.href = 'index.html'; }
      catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { target.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}


async function loadAdminDashboard() {
  const summary = document.querySelector('#admin-summary');
  const messages = document.querySelector('#admin-messages');
  if (!getToken()) { summary.innerHTML = '<p class="empty">กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ</p>'; return; }
  try {
    const [stats, inbox] = await Promise.all([api('/api/admin/summary'), api('/api/admin/messages')]);
    summary.innerHTML = `<div class="admin-stat"><strong>${stats.users}</strong><span>สมาชิก</span></div><div class="admin-stat"><strong>${stats.reviews}</strong><span>รีวิว</span></div><div class="admin-stat"><strong>${stats.comments}</strong><span>ความคิดเห็น</span></div><div class="admin-stat"><strong>${stats.newMessages}</strong><span>ข้อความใหม่</span></div>`;
    messages.innerHTML = inbox.messages.length ? inbox.messages.map((item) => `<article class="comment-item"><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.name)} · ${escapeHtml(item.email)} · ${formatDate(item.created_at)}</small><p>${escapeHtml(item.message)}</p><label>สถานะ <select class="field" data-message-status="${item.id}"><option value="new" ${item.status === 'new' ? 'selected' : ''}>ใหม่</option><option value="read" ${item.status === 'read' ? 'selected' : ''}>อ่านแล้ว</option><option value="replied" ${item.status === 'replied' ? 'selected' : ''}>ตอบแล้ว</option><option value="closed" ${item.status === 'closed' ? 'selected' : ''}>ปิดเรื่อง</option></select></label></article>`).join('') : '<p class="empty">ยังไม่มีข้อความติดต่อ</p>';
    messages.addEventListener('change', async (event) => {
      const select = event.target.closest('[data-message-status]');
      if (!select) return;
      try { await api(`/api/admin/messages/${select.dataset.messageStatus}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); toast('อัปเดตสถานะแล้ว'); }
      catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { summary.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}
