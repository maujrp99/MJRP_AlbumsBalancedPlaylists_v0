// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The samples of the editor's HTML portrait (F332 slice 1b, TASK-28): documents drawn for the field, and HTML a browser may
// leave in it read back. `rich-editor-html.kittest.mjs` compares each with what the 1.0.0 gave (`editor-html.expected.json`).
export const WORDS = { remove: 'Remove', inGarden: 'On the shelf', video: 'video' };
export const BOOKS = {
    'atomic-habits': { slug: 'atomic-habits', title: 'Atomic Habits <2nd>', author: 'James Clear', cover: '/covers/atomic.jpg', stage: 'Read' },
    'no-cover': { slug: 'no-cover', title: '', cover: null },
    'bad-cover': { slug: 'bad-cover', title: 'Bad', author: 'A & B', cover: 'javascript:x', stage: '' },
};

/** Markdown read by the core, then drawn. */
export const MARKDOWN = [
    '',
    'Um **dois** _três_ ++quatro++ ~~cinco~~ ==seis== ^sete^ ~oito~ `nove <b>` [dez](/x "t") [onze](javascript:x) & < > " \'',
    'linha um\\\nlinha dois',
    'um [grande]{.large}, **[forte e enorme]{.xlarge}** e [pequeno]{.small}',
    '#### Texto grande\n\n### Subtítulo\n\n> Uma citação\n>\n> Outra\n\n> [!NOTE]\n> Um aviso\n>\n> Segue\n\n> [!NOTE]',
    '- um\n- dois **forte**\n\n1. a\n2. b\n\n7. sete\n8. oito\n\n---',
    '![Foto <1>](/media/a.jpg "Legenda & tal")\n\n![Larga](/media/b.jpg#largo)\n\n![Uma palestra](https://youtu.be/dQw4w9WgXcQ)\n\n![](https://youtu.be/dQw4w9WgXcQ)\n\n![](https://vimeo.com/76979871)',
    '[Atomic Habits](/livro/atomic-habits "livro")\n\n[Sem capa](/livro/no-cover "livro")\n\n[Capa ruim](/livro/bad-cover "livro")\n\n[Fora da estante](/livro/unknown "livro")',
    '<script>alert(1)</script>\n\n<img src=x onerror=y>',
];

/** Blocks handed straight to `mediaHtml`, the ones a document never brings included. */
export const MEDIA = [
    { t: 'p', c: [] },
    { t: 'hr' },
    { t: 'image', src: 'javascript:x', alt: 'A "b"', caption: '', wide: false },
    { t: 'image', src: '/a.jpg', alt: '', caption: 'c', wide: true },
    { t: 'video', provider: 'youtube', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: '' },
    { t: 'video', provider: 'vimeo', id: '76979871', url: 'https://vimeo.com/76979871', caption: 'Fala' },
    { t: 'book', slug: 'atomic-habits', title: 'Written title' },
    { t: 'book', slug: 'no-cover', title: 'Written title' },
    { t: 'book', slug: 'bad-cover', title: 'Written title' },
    { t: 'book', slug: 'unknown', title: 'Written <title>' },
];

/** HTML as a browser, a paste or the editor itself leaves it. */
export const HTML = [
    '',
    '<p><br></p>',
    '<p>a <b>b</b> <i>c</i> <u>d</u> <s>e</s> <mark>f</mark> <sup>g</sup> <sub>h</sub> <strike>i</strike> <del>j</del> <ins>k</ins> <em>l</em> <strong>m</strong> <font>n</font></p>',
    '<p><span style="font-weight: bold">a</span> <span style="FONT-WEIGHT:700; font-style: italic">b</span> <span style="font-weight:400">c</span> <span style="text-decoration: underline line-through">d</span> <span style="vertical-align: super">e</span><span style="vertical-align: sub">f</span> <span style="font-weight: bolder">g</span> <span style="">h</span> <span style="font-weight:600;font-style:italic;text-decoration:underline">i</span></p>',
    '<p><a href="/ok">a</a> <a href="javascript:x">b</a> <a>c</a> <a href="https://x.y/z"><b>d</b></a> <code>e <b>f</b></code> x<br>y</p>',
    '<p>a<script>x</script><style>y</style><template>z</template><button class="ak-rt-x">Remove</button>b</p>',
    '<p>a\n\tb\r\nc</p>',
    'solto <b>forte</b><p>par</p>mais <span data-size="small">pequeno</span>',
    '<h1>a</h1><h2>b</h2><h3>c</h3><h4>d</h4><h5>e</h5><h6>f</h6><p class="lead">g</p><pre>h</pre><pre class="lead">i</pre>',
    '<blockquote>a<p>b</p><div>c<p>d</p></div><ul><li>e</li><li>f</li></ul><ol><li>g</li></ol>h <b>i</b></blockquote>',
    '<div class="callout" data-rt="callout"><p>a</p><p><br></p></div><aside><p>b</p></aside><div class="callout">c</div><div data-rt="callout"></div>',
    '<ul><li>a</li><li>b<ul><li>c</li><li>d</li></ul>e</li><li><p>f</p><p>g</p></li><li>h<div>i</div></li><ul><li>j</li></ul> <b>k</b> <li></li></ul>',
    '<ol start="3"><li>a</li></ol><ol start="1"><li>b</li></ol><ol start="x"><li>c</li></ol><ol start="2.5"><li>d</li></ol><ol><li><ol><li>e</li></ol></li><li>f<ol><li>g</li></ol></li></ol>',
    '<li>a</li><li>b <i>c</i></li>',
    '<p>a<ul><li>b</li></ul>c</p><h2>t<blockquote>q</blockquote>u</h2><p>x<figure data-rt="image" data-src="/a.jpg" data-alt="A" data-caption="" data-wide="1"></figure>y</p><pre>z<hr></pre>',
    '<figure class="ak-rt-media wide" contenteditable="false" data-rt="image" data-src="/media/a.jpg" data-alt="Foto" data-caption="Legenda" data-wide="1"><img src="/media/a.jpg" alt="Foto"><figcaption>Legenda</figcaption><button type="button" class="ak-rt-x">Remove</button></figure>',
    'antes<figure data-rt="image" data-src="/a.jpg"></figure><figure data-rt="image"></figure><figure data-rt="video" data-url="https://youtu.be/dQw4w9WgXcQ" data-caption="Fala"></figure><figure data-rt="video" data-url="https://vimeo.com/76979871"></figure>depois',
    'a<figure data-rt="video" data-url="https://example.com/x"></figure>b<figure data-rt="video"></figure>c<div data-rt="zzz">some</div>d<div data-rt="book" data-slug="atomic-habits" data-title="Atomic Habits"></div><div data-rt="book"></div><span data-rt="book" data-slug="x" data-title="X"></span>',
    '<section><p>a</p><article>b<table>c</table></article></section><div>d</div><hr><figure>e</figure><div><div><p>f</p>g</div></div>',
    '<p><span data-size="large" style="font-weight:bold">a</span><b data-size="small">b</b><span data-size="huge">c</span><span data-size="xlarge"><i>d</i></span></p>',
    '<p>  a  </p><p></p><p> </p><h3></h3><blockquote></blockquote><ul></ul>',
];
