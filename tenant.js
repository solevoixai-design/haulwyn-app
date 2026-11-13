// Shared by staff pages (ops, sales, crew, vault): the signed-in company's brand, plus a
// lockout screen when Haulwyn has suspended or canceled the company's subscription.
(function () {
  const T = window.HaulwynTenant = {
    brand: 'Your company',
    info: null,
    async load(sb) {
      T.sb = sb;
      try {
        const { data, error } = await sb.rpc('get_my_subscription');
        if (error) return null;
        const r = Array.isArray(data) ? data[0] : data;
        if (!r) return null;
        T.info = r;
        T.brand = r.company_name || T.brand;
        if (r.access_allowed === false) { T.lockout(r); return r; }
        if (r.subscription_status === 'trialing' && r.trial_ends_at) T.trialNote(r);
        T.checkPassword();
        return r;
      } catch (e) { return null; }
    },
    // Logins created from the admin console start with a temporary password.
    async checkPassword() {
      try {
        const { data } = await T.sb.auth.getUser();
        const meta = data && data.user && data.user.user_metadata;
        if (meta && meta.must_change_password) T.passwordDialog();
      } catch (e) {}
    },
    passwordDialog() {
      if (document.getElementById('hwPw')) return;
      const d = document.createElement('div');
      d.id = 'hwPw';
      d.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(10,31,68,.55);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif;color:#0b1230';
      d.innerHTML = '<form style="width:min(380px,100%);background:#fff;border-radius:12px;padding:26px">'
        + '<h2 style="font-size:19px;margin-bottom:6px">Set your password</h2>'
        + '<p style="font-size:13px;color:#5b6478;line-height:1.5;margin-bottom:14px">You signed in with a temporary password. Choose your own to continue (at least 10 characters).</p>'
        + '<input id="hwPw1" type="password" autocomplete="new-password" placeholder="New password" style="width:100%;padding:10px 12px;border:1.5px solid rgba(11,18,48,.15);border-radius:8px;margin-bottom:10px;font-size:14px">'
        + '<input id="hwPw2" type="password" autocomplete="new-password" placeholder="Repeat new password" style="width:100%;padding:10px 12px;border:1.5px solid rgba(11,18,48,.15);border-radius:8px;font-size:14px">'
        + '<div id="hwPwMsg" style="color:#d9481f;font-size:12.5px;min-height:18px;margin-top:8px"></div>'
        + '<button type="submit" style="width:100%;background:#0a1f44;color:#fff;border:none;border-radius:8px;padding:11px;font-weight:600;cursor:pointer;margin-top:6px">Save password</button></form>';
      document.body.appendChild(d);
      d.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const a = document.getElementById('hwPw1').value, b = document.getElementById('hwPw2').value, msg = document.getElementById('hwPwMsg');
        if (a.length < 10) { msg.textContent = 'Use at least 10 characters.'; return; }
        if (a !== b) { msg.textContent = 'The two passwords do not match.'; return; }
        const { error } = await T.sb.auth.updateUser({ password: a, data: { must_change_password: false } });
        if (error) { msg.textContent = 'Could not save the password. ' + (error.message || ''); return; }
        d.remove();
      });
    },
    upper() { return String(T.brand).toUpperCase(); },
    lockout(r) {
      if (document.getElementById('hwLockout')) return;
      const d = document.createElement('div');
      d.id = 'hwLockout';
      d.setAttribute('role', 'alertdialog');
      d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#f6f5f1;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif;color:#0b1230';
      const word = r.subscription_status === 'canceled' ? 'canceled' : 'paused';
      d.innerHTML = '<div style="max-width:420px;background:#fff;border:1px solid rgba(11,18,48,.12);border-radius:12px;padding:28px;text-align:center">'
        + '<h2 style="font-size:20px;margin-bottom:10px">Account ' + word + '</h2>'
        + '<p style="font-size:14px;line-height:1.6;color:#5b6478">Access for <strong></strong> is ' + word + '. Your customers\' quote and tracking links still work. '
        + 'Contact <a href="mailto:support@haulwyn.com">support@haulwyn.com</a> to restore access.</p>'
        + '<button id="hwLockoutOut" style="margin-top:16px;background:#0a1f44;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer">Sign out</button></div>';
      d.querySelector('strong').textContent = r.company_name || 'your company';
      document.body.appendChild(d);
      document.getElementById('hwLockoutOut').addEventListener('click', async () => {
        try { if (T.sb) await T.sb.auth.signOut(); } catch (e) {}
        location.reload();
      });
    },
    trialNote(r) {
      const days = Math.ceil((new Date(r.trial_ends_at) - Date.now()) / 864e5);
      if (days > 14 || document.getElementById('hwTrial')) return;
      const b = document.createElement('div');
      b.id = 'hwTrial';
      b.style.cssText = 'background:#fff4d9;color:#6b4c00;font:600 12.5px Inter,Arial,sans-serif;text-align:center;padding:7px 12px';
      b.textContent = days > 0 ? 'Free trial: ' + days + ' day' + (days === 1 ? '' : 's') + ' left. Questions? support@haulwyn.com'
        : 'Your free trial has ended. Contact support@haulwyn.com to keep access.';
      document.body.insertBefore(b, document.body.firstChild);
    }
  };
})();
