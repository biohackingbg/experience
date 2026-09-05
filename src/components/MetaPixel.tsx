import Script from "next/script";

/**
 * The browser half of the pixel. Renders nothing at all until the id is set,
 * so the site carries no advertising script by default - and the moment the
 * setting appears, page views start counting without another deploy.
 */
export function MetaPixel({ id }: { id: string | null }) {
  if (!id) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}
    </Script>
  );
}
