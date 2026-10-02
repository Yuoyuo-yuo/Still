Add-Type -AssemblyName System.Drawing
$iconDir = $PSScriptRoot
$bitmap = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#2d574c'))
$pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#fffefa')), 10
$graphics.DrawRectangle($pen, 68, 44, 126, 170)
$graphics.DrawLine($pen, 96, 44, 96, 214)
$graphics.DrawLine($pen, 119, 89, 168, 89)
$graphics.DrawLine($pen, 119, 119, 168, 119)
$bitmap.Save((Join-Path $iconDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
# Windows supports a PNG payload in a 256px ICO directory entry.
$pngBytes = [System.IO.File]::ReadAllBytes((Join-Path $iconDir 'icon.png'))
$stream = [System.IO.File]::Create((Join-Path $iconDir 'icon.ico'))
$writer = New-Object System.IO.BinaryWriter $stream
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
$writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
$writer.Write([uint16]1); $writer.Write([uint16]32)
$writer.Write([uint32]$pngBytes.Length); $writer.Write([uint32]22); $writer.Write($pngBytes)
$writer.Dispose(); $graphics.Dispose(); $pen.Dispose(); $bitmap.Dispose()
