import { buildHeadTags, type SeoMeta } from './seo';

/**
 * Renders all SEO tags for a page. Drop it anywhere in the page tree:
 * React 19 hoists <title>, <meta> and <link> into <head> automatically.
 * JSON-LD <script> tags render in place, which search engines accept.
 *
 * For SSR frameworks with their own head API (Next.js `metadata`, Remix `meta`),
 * use `buildHeadTags()` / `headTagsToHtml()` from `./seo` instead.
 */
export function Seo(props: SeoMeta) {
  const tags = buildHeadTags(props);
  return (
    <>
      {tags.map((t, i) => {
        switch (t.tag) {
          case 'title':
            return <title key="title">{t.content}</title>;
          case 'meta':
            return t.property ? <meta key={`p-${t.property}-${i}`} property={t.property} content={t.content} /> : <meta key={`n-${t.name}-${i}`} name={t.name} content={t.content} />;
          case 'link':
            return <link key={`l-${t.rel}-${t.hrefLang ?? ''}-${i}`} rel={t.rel} href={t.href} hrefLang={t.hrefLang} />;
          case 'script':
            return <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: t.content.replace(/</g, '\\u003c') }} />;
        }
      })}
    </>
  );
}
