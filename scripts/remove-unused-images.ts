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

async function findUnusedImages(): Promise<ImageCheckResult[]> {
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

async function removeUnusedImages(): Promise<void> {
  console.log("Finding and removing unused images...\n");

  const results = await findUnusedImages();

  let totalRemoved = 0;
  const removedFiles: string[] = [];

  for (const result of results) {
    if (result.unusedImages.length > 0) {
      console.log(`📄 ${result.markdownFile}`);
      console.log(`  Removing ${result.unusedImages.length} unused image(s):`);

      for (const unusedImage of result.unusedImages) {
        const imagePath = path.join(result.imageDir, unusedImage);

        try {
          fs.unlinkSync(imagePath);
          console.log(`    ✅ Removed: ${unusedImage}`);
          removedFiles.push(imagePath);
          totalRemoved++;
        } catch (error) {
          console.log(`    ❌ Failed to remove: ${unusedImage} - ${error}`);
        }
      }

      // Check if the directory is now empty and remove it if so
      const remainingFiles = fs.readdirSync(result.imageDir);
      if (remainingFiles.length === 0) {
        try {
          fs.rmdirSync(result.imageDir);
          console.log(`    🗂️  Removed empty directory: ${result.imageDir}`);
        } catch (error) {
          console.log(`    ❌ Failed to remove directory: ${result.imageDir} - ${error}`);
        }
      }

      console.log("");
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total images removed: ${totalRemoved}`);
  console.log(`  Files removed: ${removedFiles.length}`);

  if (totalRemoved > 0) {
    console.log(`\n✅ Successfully cleaned up ${totalRemoved} unused image(s)!`);
  } else {
    console.log(`\n✨ No unused images found to remove.`);
  }
}

// Add a dry-run option
async function dryRun(): Promise<void> {
  console.log("🔍 DRY RUN: Finding unused images (no files will be deleted)...\n");

  const results = await findUnusedImages();

  let totalUnused = 0;

  for (const result of results) {
    if (result.unusedImages.length > 0) {
      console.log(`📄 ${result.markdownFile}`);
      console.log(`  Would remove ${result.unusedImages.length} unused image(s):`);

      for (const unusedImage of result.unusedImages) {
        const imagePath = path.join(result.imageDir, unusedImage);
        console.log(`    - ${imagePath}`);
      }

      totalUnused += result.unusedImages.length;
      console.log("");
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total unused images found: ${totalUnused}`);

  if (totalUnused > 0) {
    console.log(`\n💡 Run without --dry-run to actually remove these files.`);
  } else {
    console.log(`\n✨ No unused images found.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  if (isDryRun) {
    await dryRun();
  } else {
    await removeUnusedImages();
  }
}

main().catch(console.error);
