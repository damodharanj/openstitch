import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import juice from 'juice';
import satori from 'satori';
import { html } from 'satori-html';
import autoprefixer from 'autoprefixer';

interface ConvertOptions {
    editableText?: boolean;
}


function cleanupHtml(html: string): string {
    return html
        // Remove gradients (bg-gradient-*, from-*, via-*, to-*)
        .replace(/\b(bg-gradient-to-[a-z]+|from-[a-z0-9-]+|via-[a-z0-9-]+|to-[a-z0-9-]+)\b/g, '')
        // Remove interaction states (hover:*, focus:*, active:*, group-hover:*)
        .replace(/\b(hover|focus|active|group-hover):[a-z0-9-\/[\]]+/g, '')
        // Remove transitions and animations
        .replace(/\b(transition(-[a-z]+)?|duration-[0-9]+|ease-[a-z-]+|animate-[a-z]+)\b/g, '')
        // Remove space-x/y (can cause complex selector issues in Satori)
        .replace(/\b(space-[xy]-[0-9]+)\b/g, '')
        // Remove backdrop filters (not supported in SVG usually)
        .replace(/\b(backdrop-[a-z0-9-]+)\b/g, '')
        // Remove cursor utilities (useless in static SVG)
        .replace(/\b(cursor-[a-z-]+)\b/g, '')
        // Replace images with simple placeholders to prevent Satori fetch/size errors
        .replace(/<img[^>]*>/g, '<div style="background-color: #e5e7eb; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 12px;">Image</div>');
}

export async function convertHtmlToSvg(rawHtml: string, options: ConvertOptions = {}) {
    const { editableText = false } = options;

    console.log('📖 1. Received HTML...');

    // Convert 'tw' to 'class' so Tailwind works
    rawHtml = rawHtml.replace(/tw=/g, 'class=');

    // --- HTML Post-Processing Cleanup ---
    // Remove unsupported or problematic classes before Tailwind processing
    rawHtml = cleanupHtml(rawHtml);

    console.log('🎨 2. Compiling Tailwind to CSS (HEX Mode)...');

    const result = await postcss([
        tailwindcss({
            content: [{ raw: rawHtml, extension: 'html' }],
            theme: { extend: {} },
            corePlugins: {
                preflight: false, // preflight resets can cause issues in Satori
                // Disable opacity variables to force HEX codes for SVG/Figma compatibility
                textOpacity: false,
                backgroundOpacity: false,
                borderOpacity: false,
                divideOpacity: false,
                ringOpacity: false,
                placeholderOpacity: false
            },
        }),
        autoprefixer,
    ]).process(`
    @tailwind utilities;
  `, { from: undefined });

    let generatedCss = result.css;
    // Append manual fallbacks ensures they are present even if PostCSS/Tailwind fails
    generatedCss += `
      /* Global Reset for Satori: Force block elements to be flex-col */
      div, header, footer, main, section, article, aside {
          display: flex;
          flex-direction: column;
      }
      /* Restore flex-row for .flex class */
      .flex {
          display: flex;
          flex-direction: row;
      }
      /* Ensure .flex-col wins over .flex if both present (order matters) */
      .flex-col {
          flex-direction: column;
      }
      /* Grid fallback */
      .grid { 
          display: flex;
          flex-direction: column !important; 
      }
      
      .hidden { display: none !important; }
      .gap-4 { gap: 1rem; }
      .gap-8 { gap: 2rem; }
      .p-4 { padding: 1rem; }
      .p-8 { padding: 2rem; }
    `;



    console.log('💉 3. Inlining CSS into HTML...');
    let inlineStyledHtml = juice.inlineContent(rawHtml, generatedCss);

    inlineStyledHtml = inlineStyledHtml
        // Satori doesn't support CSS variables in transform/shadow, and Tailwind injects them.
        .replace(/transform:\s*[^;]*var\(--tw-[^;]*;?/g, '')
        .replace(/box-shadow:\s*[^;]*var\(--tw-[^;]*;?/g, '')
        // WORKAROUND: Satori doesn't support 'display: grid'. Replace with 'flex' + 'flex-col' (imperfect but prevents crash)
        .replace(/display:\s*grid/gi, 'display: flex; flex-direction: column')
        // Remove conflicting atomic classes if they remained
        .replace(/grid-cols-[0-9]+/g, '');

    console.log('🔡 4. Downloading Fonts (Stable CDN)...');

    // Helper to fetch font with error checking
    const loadFont = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText} `);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    };

    // Using jsDelivr npm CDN for stability
    const [fontRegular, fontBold] = await Promise.all([
        loadFont('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff'),
        loadFont('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff')
    ]);

    console.log('🖼️ 5. Generating SVG...');

    const markup = html(inlineStyledHtml);

    const svg = await satori(markup, {
        width: 800,
        height: 600,
        fonts: [
            {
                name: 'Inter',
                data: fontRegular,
                weight: 400,
                style: 'normal',
            },
            {
                name: 'Inter',
                data: fontBold,
                weight: 700,
                style: 'normal',
            },
        ],
        embedFont: !editableText,
    });

    return svg;
}
