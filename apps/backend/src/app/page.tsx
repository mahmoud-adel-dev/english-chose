import React from "react";
import { existsSync } from "node:fs";
import path from "node:path";
import { getDownloads } from "@/lib/site/downloads";

export const dynamic = "force-static";

function Mark({ small = false }: { small?: boolean }) {
  return <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 9c4-2 7-1 9 1 3-2 6-3 9-1v15c-4-2-7-1-9 1-3-2-6-3-9-1V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M16 10v15M11 14h2m6 0h2m-10 4h2m6 0h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>;
}

function Arrow() { return <span aria-hidden="true">←</span>; }
function DownloadButtons({ android, ios }: { android: string | null; ios: string | null }) {
  return <div className="download-buttons">
    {android ? <a className="button primary" href={android} download="English-Coach-V2.apk"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg><span>حمّل نسخة Android (V2 المحدثة)<small>ملف APK للتثبيت المباشر · تحديث الباقات</small></span></a> : <span className="button unavailable">نسخة Android قيد التجهيز</span>}
    {ios ? <a className="button secondary" href={ios} rel="noopener noreferrer">تحميل iOS <Arrow/></a> : <span className="button secondary unavailable" aria-disabled="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M10 5h4m-3 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><span>نسخة iOS<small>قريبًا</small></span></span>}
  </div>;
}

export default function LandingPage() {
  const hasV2 = existsSync(path.join(process.cwd(), "public/downloads/english-coach-v2.apk"));
  const hasOld = existsSync(path.join(process.cwd(), "public/downloads/english-coach.apk"));
  const bundledExists = hasV2 || hasOld;
  const bundledPath = hasV2 ? "/downloads/english-coach-v2.apk" : "/downloads/english-coach.apk";
  const downloads = getDownloads({ ANDROID_DOWNLOAD_URL: process.env.ANDROID_DOWNLOAD_URL, IOS_DOWNLOAD_URL: process.env.IOS_DOWNLOAD_URL }, bundledExists, bundledPath);
  return <>
    <header className="site-header wrap">
      <a className="brand" href="#" aria-label="English Coach الرئيسية"><Mark/><span dir="ltr">English<span className="brand-light"> Coach</span><small>YOUR SPACE TO GROW</small></span></a>
      <nav aria-label="القائمة الرئيسية"><a href="#features">ليه English Coach؟</a><a href="#how-it-works">إزاي تبدأ؟</a><a href="#faq">أسئلة شائعة</a></nav>
      <a href="#download" className="nav-download">حمّل التطبيق <Arrow/></a>
    </header>
    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><span className="eyebrow"><span className="status-dot"/> تعلّم براحتك. اتقدم كل يوم.</span>
          <h1 id="hero-title">خطوة صغيرة،<br/><span>إنجليزي أقوى.</span></h1>
          <p>مش لازم تعرف كل الكلمات عشان تبدأ.<br className="desktop-break"/> مع مدرّبك الذكي، كل محاولة فرصة تتكلم، تفهم، وتاخد خطوة لقدّام.</p>
          <DownloadButtons {...downloads}/>
          <div className="hero-notes"><span>✓ ملاحظات مفهومة بالعربي</span><span>✓ من A1 إلى C2</span></div>
        </div>
        <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><img className="coach-art" src="/illustrations/coach.svg" alt="رفيق تعلم أزرق بسماعات، محاط بكتب وفقاعات محادثة" width="540" height="480" fetchPriority="high"/><span className="floating-note note-one"><span className="note-icon">✦</span><span>على مهلك…<strong>المهم إنك بتتقدم.</strong></span></span><span className="floating-note note-two"><span className="check-icon">✓</span> A little practice goes a long way.</span></div>
      </section>
      <div className="strip"><div className="wrap strip-inner"><span>مساحة واحدة لكل خطواتك</span><span>تدرّب <i>✦</i> اتكلم <i>✦</i> اتعلم <i>✦</i> كرر بثقة</span><span dir="ltr">A1 · A2 · B1 · B2 · C1 · C2</span></div></div>
      <section className="section wrap" id="features">
        <div className="section-heading"><div><span className="section-kicker">مصمّم لرحلتك</span><h2>إنجليزي يناسب مستواك.<br/><span>ومساحة تناسبك.</span></h2></div><p>أدوات بسيطة تساعدك تحوّل الرغبة في التعلم<br/>لخطوات واضحة تقدر ترجع لها كل يوم.</p></div>
        <div className="feature-grid">
          <article className="feature-card lavender"><span className="feature-symbol" aria-hidden="true">↗</span><span className="card-label">اعرف نقطة البداية</span><h3>ابدأ من مستواك</h3><p>اختبار تفاعلي بيغيّر صعوبة أسئلته حسب إجاباتك، عشان تبدأ التدريب من نقطة مناسبة.</p><span className="card-detail">CEFR placement · A1–C2</span></article>
          <article className="feature-card blue"><span className="feature-symbol" aria-hidden="true">☷</span><span className="card-label">خطوة كل يوم</span><h3>تدريب، من غير ضغط</h3><p>تمارين قصيرة في القواعد والتعبير، وتصحيح إنجليزي مع شرح عربي يساعدك تفهم أخطاءك.</p><span className="card-detail">Daily practice · Clear feedback</span></article>
          <article className="feature-card peach"><span className="feature-symbol" aria-hidden="true">❝</span><span className="card-label">الكلام بيبدأ بمحاولة</span><h3>خد راحتك في المحادثة</h3><p>اتدرّب على التعبير في مواقف مختلفة، واحتفظ بالكلمات الجديدة عشان ترجع لها بسهولة.</p><span className="card-detail">AI conversation · Saved words</span></article>
        </div>
      </section>
      <section className="experience-section" id="how-it-works"><div className="wrap experience-grid">
        <div className="app-preview" aria-label="معاينة توضيحية لواجهة التطبيق"><div className="preview-top"><span className="mini-brand"><Mark small/> English Coach</span><span className="preview-tag">لمحة عن التجربة</span></div><p className="preview-greeting">مساحتك للتقدم <span>✦</span></p><h3>جاهز لخطوة جديدة؟</h3><div className="preview-hero"><div><span className="tiny-label">YOUR DAILY MOMENT</span><h4>قليل من التدريب.<br/>كثير من الثقة.</h4><span className="preview-cta">ابدأ التدريب ←</span></div><img src="/illustrations/coach.svg" alt="" width="170" height="150" loading="lazy"/></div><div className="preview-cards"><div><span>↗</span><strong>تحديد المستوى</strong><small>اعرف نقطة بدايتك</small></div><div><span>❝</span><strong>محادثة ذكية</strong><small>عبّر بطريقتك</small></div></div><div className="preview-bottom"><span>⌂ الرئيسية</span><span>◈ التدريب</span><span>▤ التعلم</span><span>♡ كلماتي</span></div></div>
        <div className="steps-copy"><span className="section-kicker">رحلتك أبسط مما تتخيل</span><h2>ابدأ بمحاولة.<br/><span>وخلي الباقي علينا.</span></h2><ol className="steps"><li><span>01</span><div><h3>اعمل حسابك</h3><p>مكان واحد يحفظ تقدمك وكلماتك وتدريباتك.</p></div></li><li><span>02</span><div><h3>اعرف مستواك</h3><p>ابدأ باختبار تحديد المستوى، أو اختار نقطة بدايتك.</p></div></li><li><span>03</span><div><h3>خد أول خطوة</h3><p>تمرّن، راجع الملاحظات، وارجع بكرة بخبرة أكتر.</p></div></li></ol></div>
      </div></section>
      <section className="section wrap faq-section" id="faq"><div><span className="section-kicker">قبل أول خطوة</span><h2>في بالك سؤال؟</h2><p>إجابات بسيطة، عشان تبدأ وأنت مرتاح.</p></div><div className="faq-list">
        <details><summary>هل لازم أكون بعرف أتكلم إنجليزي؟</summary><p>التطبيق فيه مستويات من A1 إلى C2. تقدر تبدأ من الأساسيات أو تعمل اختبار يساعدك تختار المستوى المناسب.</p></details>
        <details><summary>هل الملاحظات والتصحيح بالعربي؟</summary><p>أيوه، الشرح بيكون بالعربي مع أمثلة وتصحيح بالإنجليزي. عدد الجلسات والمحاولات المتاحة بيتحدد حسب باقة حسابك.</p></details>
        <details><summary>إزاي أثبّت نسخة Android؟</summary><p>حمّل ملف APK من الزر، وافتحه على هاتف Android. لو طلب الهاتف السماح بالتثبيت من المتصفح، راجع المصدر واسمح بالتثبيت للملف اللي حمّلته من الموقع.</p></details>
        <details><summary>هل فيه تقييم للنطق أو نسخة iPhone؟</summary><p>التقييم الحالي بيعتمد على نص إجابتك، ومش قياس صوتي لدقة النطق. {downloads.ios ? "نسخة iOS متاحة عبر رابط التوزيع الموجود في الصفحة." : "نسخة iOS هتظهر هنا لما رابط توزيعها يبقى متاح."}</p></details>
      </div></section>
      <section className="download-section wrap" id="download"><span className="section-kicker">البداية مش لازم تكون كبيرة</span><h2>مكانك هنا.<br/><span>وأول خطوة بإيدك.</span></h2><p>خلي English Coach جزء صغير من يومك.</p><DownloadButtons {...downloads}/><p className="download-footnote">Android · إصدار V2 المحدث 1.0.2 &nbsp; / &nbsp; iOS · {downloads.ios ? "متاح عبر رابط التوزيع" : "قريبًا"}</p></section>
    </main>
    <footer className="site-footer wrap"><a className="brand" href="#"><Mark small/><span dir="ltr">English Coach</span></a><span>تعلّم خطوة بخطوة، وبطريقتك.</span><span dir="ltr">© {new Date().getFullYear()} English Coach</span></footer>
  </>;
}
