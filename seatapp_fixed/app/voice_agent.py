import speech_recognition as sr
import re
from datetime import date as dt_date

def get_spoken_input(prompt: str = "Say something: ", language: str = "en-US") -> str:
    recognizer = sr.Recognizer()
    recognizer.pause_threshold = 1
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    with sr.Microphone() as source:
        print(prompt)
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source)

    try:
        text = recognizer.recognize_google(audio, language=language)
        print(f"You said ({language}): {text}")
        return text
    except sr.UnknownValueError:
        print("Sorry, I could not understand you.")
    except sr.RequestError as e:
        print(f"API error: {e}")
    return ""

def process_voice_reservation(language: str = "en-US") -> dict:
    """
    Triggers the microphone, listens for a command in the specified language,
    parses it, and returns the reservation details or an error message.
    """
    prompts = {
        "en-US": "\nPlease speak your reservation (e.g., 'Book seat 401 on floor 1 in building Agora'): ",
        "nl-NL": "\nSpreek uw reservering uit (bijv., 'Reserveer plek 401 op verdieping 1 in gebouw Agora'): "
    }
    
    prompt = prompts.get(language, prompts["en-US"])
    user_text = get_spoken_input(prompt, language=language)
    
    if not user_text:
        return {"status": "error", "message": "No voice input detected."}
        
    text_lower = user_text.lower()
    
    # Language-specific number and keyword mapping
    if language == "nl-NL":
        num_map = {
            "één": "1", "twee": "2", "drie": "3", "vier": "4", "vijf": "5",
            "zes": "6", "zeven": "7", "acht": "8", "negen": "9", "tien": "10",
            "elf": "11", "twaalf": "12"
        }
        # Keywords
        seat_keywords = r'(?:plek|stoel|zetel|seat)'
        floor_keywords = r'(?:verdieping|etage|floor|op)'
        building_keywords = r'(?:gebouw|building)'
        
        # Dutch specific corrections
        text_lower = text_lower.replace("gebouw aura", "gebouw agora")
        text_lower = text_lower.replace("gebouw a quarter", "gebouw agora")
    else:
        # English defaults
        num_map = {
            "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
            "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
            "eleven": "11", "twelve": "12"
        }
        seat_keywords = r'seat'
        floor_keywords = r'(?:floor|on)'
        building_keywords = r'building'
        
        # English corrections
        text_lower = text_lower.replace("building aura", "building agora")
        text_lower = text_lower.replace("building aggra", "building agora")
        text_lower = text_lower.replace("building a quarter", "building agora")

    # Replace spoken words with digits
    for word, digit in num_map.items():
        text_lower = text_lower.replace(f" {word} ", f" {digit} ")
        if text_lower.endswith(f" {word}"):
            text_lower = text_lower[:-len(word)] + digit

    # Very basic regex parser to extract reservation info
    seat_match = re.search(seat_keywords + r'\s+(\d+)', text_lower)
    floor_match = re.search(floor_keywords + r'\s+(\d+)', text_lower)
    building_match = re.search(building_keywords + r'\s+([a-zA-Z]+)', text_lower)
    # Handle dates (stays similar as numbers usually are recognized as digits in both languages)
    date_match = re.search(r'(\d{4})[-\s/]?(\d{2})[-\s/:]?(\d{2})', text_lower)
    
    if seat_match and floor_match and building_match:
        seat = int(seat_match.group(1))
        floor = int(floor_match.group(1))
        building = building_match.group(1).title()
        
        res_date = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}" if date_match else dt_date.today().isoformat()
        
        return {
            "status": "success",
            "data": {
                "building": building,
                "floor": floor,
                "seat_number": seat,
                "date": res_date,
                "reserved_by": "Voice Agent"
            },
            "transcript": user_text
        }
    else:
        return {
            "status": "error", 
            "message": "Could not understand reservation details." if language == "en-US" else "Kon de reserveringsgegevens niet begrijpen.",
            "transcript": user_text
        }

if __name__ == "__main__":
    print("DeskHero Voice Agent Service Mode. Testing Dutch...")
    result = process_voice_reservation(language="nl-NL")
    print(f"Result: {result}")