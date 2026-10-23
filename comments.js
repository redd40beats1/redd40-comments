'use strict';
// Public embed settings supplied by the site owner. This is not a login token.
// Owner authentication and moderation stay on HTML Comment Box / Google.
const REDD40_COMMENTS = Object.freeze({
  pageUrl: 'https://redd40tech.neocities.org/',
  moderatorId: '$1$wq1rdBcg$68I1vdtlc4Mbn1Xkdu88D1',
  options: 16798,
  pageSize: 10
});

(() => {
  const section = document.getElementById('comments');
  if (!section) return;
  const status = document.getElementById('comments-status');
  const load = document.getElementById('load-comments');
  const tools = document.getElementById('comments-tools');
  const randomize = document.getElementById('random-name');
  const mount = document.getElementById('HCB_comment_box');
  const embed = document.getElementById('comments-embed');
  const prefixes = ['Liberty','Patriot','StarsAndStripes','RedWhiteBlue','American','Freedom',
    'StarSpangled','OldGlory','Independence','United','Frontier','Union','LibertyBell',
    'Continental','AllAmerican','Victory','Brave','Loyal','Bold','Resolute','Soaring',
    'Steadfast','Crimson','Cobalt','Silver','Golden','Midnight','Radiant','Iron',
    'Thunder','Proud','Fearless'];
  const subjects = ['Eagle','Gamer','Rider','Rocket','Falcon','Racer','Hawk','Bison',
    'Mustang','Ranger','Scout','Pioneer','Trailblazer','Pilot','Rocketeer','Comet',
    'Meteor','Sentinel','Voyager','Explorer','Striker','Navigator','Firebird',
    'TrailRider','SkyRider','Starfighter','Pathfinder','Skyhawk','Outrider','Ace',
    'Maverick','Wayfarer'];
  function generateName() {
    const numbers = new Uint32Array(3);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(numbers);
    else for (let i=0;i<3;i++) numbers[i] = Math.floor(Math.random()*1000000);
    return prefixes[numbers[0]%prefixes.length] + subjects[numbers[1]%subjects.length] + String(1000+numbers[2]%999000);
  }
  let chosenName = generateName();
  let loading = false;
  let attempt = 0;
  let readyAttempt = 0;
  let timer;
  const knownNames = new WeakSet();
  function labelField(input, text) {
    const id = input.id + '-label';
    if (!section.querySelector('#'+id)) {
      const label = document.createElement('label');
      label.id = id; label.htmlFor = input.id; label.className = 'comment-field-label'; label.textContent = text;
      input.before(label);
    }
  }
  function prepareForm() {
    const name = mount.querySelector('#hcb_form_name');
    const content = mount.querySelector('#hcb_form_content');
    if (!name || !content) return false;
    if (!knownNames.has(name)) {
      // Use a guest nickname instead of automatically publishing an account name.
      name.value = chosenName;
      name.maxLength = 40;
      name.autocomplete = 'off';
      name.setAttribute('aria-describedby','name-help');
      labelField(name,'Display name');
      name.addEventListener('input',()=>{chosenName=name.value;});
      name.addEventListener('blur',()=>{if(!name.value.trim()){chosenName=generateName();name.value=chosenName;}});
      knownNames.add(name);
    }
    content.maxLength = 4096;
    labelField(content,'Your comment');
    // Prevent query strings, local preview URLs and fragments splitting discussions.
    const refer = mount.querySelector('#hcb_refer');
    if (refer) refer.value = REDD40_COMMENTS.pageUrl + '#comments';
    for (const link of mount.querySelectorAll('a[target="_blank"]')) link.rel = 'noopener noreferrer';
    return true;
  }
  function markReady() {
    if (!prepareForm()) return;
    clearTimeout(timer);
    loading = false;
    embed.hidden = false;
    load.hidden = true;
    tools.hidden = false;
    if (readyAttempt !== attempt) {
      readyAttempt = attempt;
      status.textContent = 'Comments loaded. You can edit the generated name before posting. Comments may need approval before appearing.';
    }
  }
  new MutationObserver(()=>{if (loading || readyAttempt) markReady();})
    .observe(mount,{childList:true,subtree:true});
  randomize.addEventListener('click',()=>{
    chosenName = generateName();
    const name = mount.querySelector('#hcb_form_name');
    if(name){name.value=chosenName;name.dispatchEvent(new Event('input',{bubbles:true}));name.focus();}
  });

  load.hidden = false;
  load.disabled = false;
  load.addEventListener('click',()=>{
    if (loading) return;
    loading = true; attempt += 1;
    const thisAttempt = attempt;
    load.disabled = true;
    status.textContent = 'Loading comments...';
    embed.hidden = false;
    mount.textContent = 'Connecting to HTML Comment Box...';
    window.hcb_user = {
      PAGE: REDD40_COMMENTS.pageUrl,
      MAX_CHARS: 4096,
      name_label: 'Display name',
      content_label: 'Write your comment here',
      submit: 'Post comment',
      onload: ()=>{if (thisAttempt === attempt) markReady();}
    };
    const script = document.createElement('script');
    script.id = 'hcb';
    const url = new URL('https://www.htmlcommentbox.com/jread');
    url.searchParams.set('page',REDD40_COMMENTS.pageUrl);
    url.searchParams.set('mod',REDD40_COMMENTS.moderatorId);
    url.searchParams.set('opts',String(REDD40_COMMENTS.options));
    url.searchParams.set('num',String(REDD40_COMMENTS.pageSize));
    url.searchParams.set('ts',String(Date.now()));
    script.src = url.href;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    function fail() {
      if (thisAttempt !== attempt || readyAttempt === thisAttempt) return;
      clearTimeout(timer); loading = false; script.remove();
      load.disabled = false; load.hidden = false; load.textContent = 'Try loading comments again';
      embed.hidden = true;
      status.textContent = 'Comments could not load. Try again, or use the HTML Comment Box site to check the service. No comment was submitted.';
    }
    script.onerror = fail;
    script.onload = ()=>{if (thisAttempt === attempt) {if(prepareForm())markReady();else fail();}};
    timer = setTimeout(fail,15000);
    document.head.append(script);
  });
})();
