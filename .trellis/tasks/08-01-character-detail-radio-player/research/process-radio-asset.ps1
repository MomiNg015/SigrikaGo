param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class RadioAssetProcessor
{
    private static bool IsBackgroundCandidate(Color color)
    {
        int max = Math.Max(color.R, Math.Max(color.G, color.B));
        int min = Math.Min(color.R, Math.Min(color.G, color.B));
        return min >= 232 && max - min <= 16;
    }

    public static void Process(string sourcePath, string outputPath)
    {
        using (var original = new Bitmap(sourcePath))
        using (var source = new Bitmap(1020, 385, PixelFormat.Format24bppRgb))
        {
            using (var graphics = Graphics.FromImage(source))
            {
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.DrawImage(original, new Rectangle(0, 0, source.Width, source.Height));
            }

            int width = source.Width;
            int height = source.Height;
            var background = new bool[width * height];
            var queued = new bool[width * height];
            var queue = new Queue<int>();

            Action<int, int> enqueue = (x, y) => {
                int index = y * width + x;
                if (queued[index]) return;
                queued[index] = true;
                if (IsBackgroundCandidate(source.GetPixel(x, y))) queue.Enqueue(index);
            };

            for (int x = 0; x < width; x++)
            {
                enqueue(x, 0);
                enqueue(x, height - 1);
            }
            for (int y = 1; y < height - 1; y++)
            {
                enqueue(0, y);
                enqueue(width - 1, y);
            }

            int[] dx = { -1, 1, 0, 0 };
            int[] dy = { 0, 0, -1, 1 };
            while (queue.Count > 0)
            {
                int index = queue.Dequeue();
                background[index] = true;
                int x = index % width;
                int y = index / width;
                for (int direction = 0; direction < 4; direction++)
                {
                    int nx = x + dx[direction];
                    int ny = y + dy[direction];
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    enqueue(nx, ny);
                }
            }

            var foreground = new bool[width * height];
            var foregroundVisited = new bool[width * height];
            List<int> largestComponent = null;
            for (int start = 0; start < foregroundVisited.Length; start++)
            {
                if (background[start] || foregroundVisited[start]) continue;
                var component = new List<int>();
                queue.Enqueue(start);
                foregroundVisited[start] = true;
                while (queue.Count > 0)
                {
                    int index = queue.Dequeue();
                    component.Add(index);
                    int x = index % width;
                    int y = index / width;
                    for (int direction = 0; direction < 4; direction++)
                    {
                        int nx = x + dx[direction];
                        int ny = y + dy[direction];
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                        int neighbor = ny * width + nx;
                        if (background[neighbor] || foregroundVisited[neighbor]) continue;
                        foregroundVisited[neighbor] = true;
                        queue.Enqueue(neighbor);
                    }
                }
                if (largestComponent == null || component.Count > largestComponent.Count)
                {
                    largestComponent = component;
                }
            }

            if (largestComponent == null)
            {
                throw new InvalidOperationException("No foreground radio pixels were detected.");
            }
            foreach (int index in largestComponent) foreground[index] = true;

            int minX = width;
            int minY = height;
            int maxX = -1;
            int maxY = -1;
            for (int y = 0; y < height; y++)
            for (int x = 0; x < width; x++)
            {
                if (!foreground[y * width + x]) continue;
                minX = Math.Min(minX, x);
                minY = Math.Min(minY, y);
                maxX = Math.Max(maxX, x);
                maxY = Math.Max(maxY, y);
            }

            const int padding = 3;
            minX = Math.Max(0, minX - padding);
            minY = Math.Max(0, minY - padding);
            maxX = Math.Min(width - 1, maxX + padding);
            maxY = Math.Min(height - 1, maxY + padding);
            int cropWidth = maxX - minX + 1;
            int cropHeight = maxY - minY + 1;

            using (var crop = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb))
            {
                for (int y = 0; y < cropHeight; y++)
                for (int x = 0; x < cropWidth; x++)
                {
                    int sourceX = minX + x;
                    int sourceY = minY + y;
                    Color color = source.GetPixel(sourceX, sourceY);
                    crop.SetPixel(x, y, foreground[sourceY * width + sourceX]
                        ? Color.FromArgb(255, color.R, color.G, color.B)
                        : Color.FromArgb(0, color.R, color.G, color.B));
                }

                const int outputWidth = 920;
                const int outputHeight = 200;
                const int safePaddingX = 20;
                const int safePaddingY = 20;
                using (var output = new Bitmap(outputWidth, outputHeight, PixelFormat.Format32bppArgb))
                using (var graphics = Graphics.FromImage(output))
                {
                    graphics.Clear(Color.Transparent);
                    graphics.CompositingMode = CompositingMode.SourceCopy;
                    graphics.CompositingQuality = CompositingQuality.HighQuality;
                    graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    graphics.SmoothingMode = SmoothingMode.HighQuality;
                    int availableWidth = output.Width - safePaddingX * 2;
                    int availableHeight = output.Height - safePaddingY * 2;
                    double scale = Math.Min(
                        (double)availableWidth / crop.Width,
                        (double)availableHeight / crop.Height
                    );
                    int drawWidth = Math.Max(1, (int)Math.Round(crop.Width * scale));
                    int drawHeight = Math.Max(1, (int)Math.Round(crop.Height * scale));
                    int drawX = (output.Width - drawWidth) / 2;
                    int drawY = (output.Height - drawHeight) / 2;
                    graphics.DrawImage(crop, new Rectangle(drawX, drawY, drawWidth, drawHeight));
                    output.Save(outputPath, ImageFormat.Png);
                }
            }
        }
    }
}
"@

[RadioAssetProcessor]::Process($SourcePath, $OutputPath)

$asset = [System.Drawing.Bitmap]::FromFile($OutputPath)
try {
  [pscustomobject]@{
    Path = $OutputPath
    Width = $asset.Width
    Height = $asset.Height
    PixelFormat = $asset.PixelFormat.ToString()
    TopLeftAlpha = $asset.GetPixel(0, 0).A
    FileBytes = (Get-Item -LiteralPath $OutputPath).Length
  }
} finally {
  $asset.Dispose()
}
