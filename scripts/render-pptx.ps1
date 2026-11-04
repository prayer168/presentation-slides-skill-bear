param([Parameter(Mandatory=$true)][string]$InputFile,[Parameter(Mandatory=$true)][string]$OutputDir)
$ErrorActionPreference='Stop'
$deckPath=[IO.Path]::GetFullPath($InputFile)
$renderPath=[IO.Path]::GetFullPath($OutputDir)
New-Item -ItemType Directory -Path $renderPath -Force | Out-Null
$app=$null;$deck=$null
try {
 $app=New-Object -ComObject PowerPoint.Application
 $deck=$app.Presentations.Open($deckPath,$true,$false,$false)
 $slides=@();$jumps=@();$outside=@()
 $width=[double]$deck.PageSetup.SlideWidth;$height=[double]$deck.PageSetup.SlideHeight
 for($i=1;$i -le $deck.Slides.Count;$i++) {
  $slide=$deck.Slides.Item($i)
  $file=Join-Path $renderPath ('slide-{0:d2}.png' -f $i)
  $slide.Export($file,'PNG',1600,900)
  $slides+=@{slide=$i;file=[IO.Path]::GetFileName($file);shapes=$slide.Shapes.Count}
  foreach($shape in $slide.Shapes) {
   if($shape.Left -lt -2 -or $shape.Top -lt -2 -or ($shape.Left+$shape.Width) -gt ($width+2) -or ($shape.Top+$shape.Height) -gt ($height+2)) {$outside+=@{slide=$i;shape=$shape.Name}}
   foreach($trigger in @(1,2)) {
    try {$setting=$shape.ActionSettings.Item($trigger);if($setting.Action -eq 7){$jumps+=@{slide=$i;shape=$shape.Name;address=[string]$setting.Hyperlink.Address;subAddress=[string]$setting.Hyperlink.SubAddress}}}catch{}
   }
  }
 }
 @{engine='Microsoft PowerPoint COM';slides=$slides;hyperlinks=$jumps;outsideSlide=$outside;scope='Actual open and PNG export; geometry flags need visual review. Slideshow hyperlink clicks were not executed.'}|ConvertTo-Json -Depth 8|Set-Content -Encoding UTF8 (Join-Path $renderPath 'render-report.json')
} finally {
 if($null -ne $deck){$deck.Close();[Runtime.InteropServices.Marshal]::ReleaseComObject($deck)|Out-Null}
 # Avoid quitting a PowerPoint instance that may also contain user documents.
 if($null -ne $app){if($app.Presentations.Count -eq 0){$app.Quit()};[Runtime.InteropServices.Marshal]::ReleaseComObject($app)|Out-Null}
}
