"""Optional asset regeneration only; eSpeak NG and ffmpeg are build-time tools, not app dependencies."""
import json, os, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1];target=root/'dist/audio/fa';target.mkdir(parents=True,exist_ok=True)
phrases={'enabled':'راهنمای صوتی فارسی روشن است','left':'به چپ بپیچید','right':'به راست بپیچید','continue':'در مسیر ادامه دهید','exit':'از خروجی پیش رو خارج شوید','roundabout':'به میدان نزدیک می‌شوید. مسیر مشخص شده روی نقشه را دنبال کنید','arrive':'به مقصد نزدیک می‌شوید','reached':'به مقصد رسیدید','speed':'حد سرعت در پیش رو تغییر می‌کند. به تابلوهای جاده توجه کنید'}
engine=os.environ.get('RAHYAR_ESPEAK','espeak-ng');data=os.environ.get('RAHYAR_ESPEAK_PATH');version=subprocess.check_output([engine]+(['--path='+data] if data else [])+['--version'],text=True).splitlines()[0].split('  Data at:')[0]
for key,text in phrases.items():
 wav='/tmp/rahyar-fa-'+key+'.wav';args=[engine]+(['--path='+data] if data else [])+['-v','fa','-s','145','-w',wav,text];subprocess.run(args,check=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',wav,'-codec:a','libmp3lame','-b:a','48k',str(target/(key+'.mp3'))],check=True)
 pathlib.Path(wav).unlink()
(target/'manifest.json').write_text(json.dumps({'engine':version,'language':'fa','kind':'synthetic fixed navigation phrases; no arbitrary road-name speech','phrases':phrases},ensure_ascii=False,indent=2)+'\n')
