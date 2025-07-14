import fs from "fs";
import { glob } from "glob";
import path from "path";

interface ImageCheckResult {
  markdownFile: string;
  imageDir: string;
  referencedImages: string[];
  actualImages: string[];
  unusedImages: string[];
  missingImages: string[];
}

function extractImageReferences(content: string): string[] {
  // Match various image reference patterns
  const patterns = [
    /!\[.*?\]\(\.\/([^)]+)\)/g, // ![alt](./image.png)
    /!\[.*?\]\(([^)]+)\)/g, // ![alt](image.png)
    /src="([^"]+)"/g, // src="image.png"
    /src='([^']+)'/g, // src='image.png'
  ];

  const images = new Set<string>();

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const imagePath = match[1];
      if (imagePath) {
        // Extract just the filename from the path
        const filename = path.basename(imagePath);
        images.add(filename);
      }
    }
  });

  return Array.from(images);
}

function getImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"].includes(ext);
  });
}

async function checkUnusedImages(): Promise<ImageCheckResult[]> {
  const results: ImageCheckResult[] = [];

  // Find all markdown files in content/posts
  const markdownFiles = await glob("content/posts/**/*.md");

  for (const markdownFile of markdownFiles) {
    const content = fs.readFileSync(markdownFile, "utf-8");
    const referencedImages = extractImageReferences(content);

    // Determine the image directory (same name as markdown file without extension)
    const markdownDir = path.dirname(markdownFile);
    const markdownName = path.basename(markdownFile, ".md");
    const imageDir = path.join(markdownDir, markdownName);

    const actualImages = getImageFiles(imageDir);

    // Find unused images (exist but not referenced)
    const unusedImages = actualImages.filter((img) => !referencedImages.includes(img));

    // Find missing images (referenced but don't exist)
    const missingImages = referencedImages.filter((img) => !actualImages.includes(img));

    results.push({
      markdownFile,
      imageDir,
      referencedImages,
      actualImages,
      unusedImages,
      missingImages,
    });
  }

  return results;
}

async function main() {
  console.log("Checking for unused images in markdown posts...\n");

  const results = await checkUnusedImages();

  let totalUnused = 0;
  let totalMissing = 0;

  for (const result of results) {
    if (result.unusedImages.length > 0 || result.missingImages.length > 0) {
      console.log(`📄 ${result.markdownFile}`);

      if (result.unusedImages.length > 0) {
        console.log(`  ❌ Unused images (${result.unusedImages.length}):`);
        result.unusedImages.forEach((img) => {
          console.log(`    - ${img}`);
        });
        totalUnused += result.unusedImages.length;
      }

      if (result.missingImages.length > 0) {
        console.log(`  ⚠️  Missing images (${result.missingImages.length}):`);
        result.missingImages.forEach((img) => {
          console.log(`    - ${img}`);
        });
        totalMissing += result.missingImages.length;
      }

      console.log("");
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total unused images: ${totalUnused}`);
  console.log(`  Total missing images: ${totalMissing}`);

  if (totalUnused > 0) {
    console.log(`\n💡 You can remove ${totalUnused} unused image(s) to clean up your repository.`);
  }

  if (totalMissing > 0) {
    console.log(`\n⚠️  You have ${totalMissing} missing image(s) that are referenced but don't exist.`);
  }
}

main().catch(console.error);
