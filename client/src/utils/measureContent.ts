/**
 * Utility functions for measuring HTML content dimensions
 */

export interface ContentDimensions {
    width: number;
    height: number;
}

/**
 * Measures the actual rendered dimensions of HTML content by rendering it in a hidden iframe
 * @param html - The HTML content to measure
 * @param frameType - The frame type ('desktop' or 'mobile') for viewport constraints
 * @returns Promise resolving to the measured dimensions
 */
export function measureHtmlContent(html: string, frameType: 'desktop' | 'mobile' = 'desktop'): Promise<ContentDimensions> {
    return new Promise((resolve) => {
        // Create a hidden iframe for measurement
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.visibility = 'hidden';
        iframe.style.pointerEvents = 'none';
        
        // Set viewport width based on frame type
        const viewportWidth = frameType === 'mobile' ? 375 : 1024;
        
        const srcDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <meta name="viewport" content="width=${viewportWidth}, initial-scale=1.0">
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    overflow: hidden;
                    width: ${viewportWidth}px;
                    min-height: 100vh;
                }
                * {
                    box-sizing: border-box;
                }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;
        
        iframe.srcdoc = srcDoc;
        
        const handleLoad = () => {
            try {
                const doc = iframe.contentDocument;
                if (!doc) {
                    // Fallback to default dimensions
                    resolve({ width: viewportWidth, height: frameType === 'mobile' ? 667 : 768 });
                    return;
                }
                
                const body = doc.body;
                const htmlElement = doc.documentElement;
                
                // Get the actual content dimensions
                const contentWidth = Math.max(
                    body.scrollWidth,
                    body.offsetWidth,
                    htmlElement.scrollWidth,
                    htmlElement.offsetWidth,
                    htmlElement.clientWidth,
                    viewportWidth // Ensure minimum width
                );
                
                const contentHeight = Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    htmlElement.scrollHeight,
                    htmlElement.offsetHeight,
                    htmlElement.clientHeight,
                    100 // Ensure minimum height
                );
                
                // Apply reasonable constraints
                const maxWidth = frameType === 'mobile' ? 600 : 1200;
                const maxHeight = 1200;
                
                const finalWidth = Math.min(contentWidth, maxWidth);
                const finalHeight = Math.min(contentHeight, maxHeight);
                
                resolve({ width: finalWidth, height: finalHeight });
            } catch (error) {
                console.error('Error measuring content:', error);
                // Fallback to default dimensions
                resolve({ width: viewportWidth, height: frameType === 'mobile' ? 667 : 768 });
            } finally {
                // Clean up
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }
        };
        
        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', () => {
            console.error('Error loading measurement iframe');
            resolve({ width: viewportWidth, height: frameType === 'mobile' ? 667 : 768 });
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        });
        
        document.body.appendChild(iframe);
    });
}

/**
 * Quick synchronous measurement for simple content (estimates based on content analysis)
 * @param html - The HTML content to estimate dimensions for
 * @param frameType - The frame type for base dimensions
 * @returns Estimated dimensions
 */
export function estimateHtmlContent(html: string, frameType: 'desktop' | 'mobile' = 'desktop'): ContentDimensions {
    const baseWidth = frameType === 'mobile' ? 375 : 1024;
    const baseHeight = frameType === 'mobile' ? 667 : 768;
    
    // Simple heuristics based on content
    const hasImages = html.includes('<img') || html.includes('background-image');
    const hasGrid = html.includes('grid') || html.includes('grid-cols');
    const hasLongText = (html.match(/p>/g) || []).length > 3;
    const hasCards = html.includes('card') || html.includes('rounded');
    
    let heightMultiplier = 1;
    
    if (hasGrid) heightMultiplier *= 1.2;
    if (hasLongText) heightMultiplier *= 1.3;
    if (hasCards) heightMultiplier *= 1.1;
    if (hasImages) heightMultiplier *= 1.15;
    
    return {
        width: baseWidth,
        height: Math.min(baseHeight * heightMultiplier, 1200)
    };
}