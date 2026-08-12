import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave


SCRIPT = Path(__file__).with_name("generate-chinese-space-audio.py")
SPEC = importlib.util.spec_from_file_location("chinese_space_audio", SCRIPT)
audio = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audio)


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return b"wav"


class SynthesisRequestTest(unittest.TestCase):
    def test_repeats_a_target_for_short_text_inference(self):
        self.assertEqual(audio.synthesis_text("老師"), "老師，老師，老師。")

    def test_requests_repeated_text_with_stable_sampling_parameters(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.wav"
            with patch.object(audio, "urlopen", return_value=Response()) as urlopen:
                audio.request_wav("http://127.0.0.1:9880", "/tmp/reference.wav", "提示", "老師", output)

        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:9880/")
        self.assertEqual(json.loads(request.data), {
            "refer_wav_path": "/tmp/reference.wav",
            "prompt_text": "提示",
            "prompt_language": "yue",
            "text": "老師，老師，老師。",
            "text_language": "yue",
            "top_k": 20,
            "top_p": 0.6,
            "temperature": 0.6,
        })

    def test_retries_a_quiet_wav_before_accepting_an_audible_one(self):
        def write_wav(path, peak):
            with wave.open(str(path), "wb") as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(24000)
                output.writeframes(int(peak * 32767).to_bytes(2, "little", signed=True) * 64)

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.wav"
            peaks = iter((0.001, 0.4))

            def generate(*args):
                write_wav(args[-1], next(peaks))

            with patch.object(audio, "request_wav", side_effect=generate) as request:
                audio.request_audible_wav("http://127.0.0.1:9880", "/tmp/reference.wav", "提示", "老師", output)

        self.assertEqual(request.call_count, 2)


if __name__ == "__main__":
    unittest.main()
