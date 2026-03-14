import speech_recognition as sr

def get_spoken_input(prompt: str = "Say something: ") -> str:
    recognizer = sr.Recognizer()
    recognizer.pause_threshold = 1 #minimum sec silence to end phrase
    recognizer.energy_threshold = 300 #to deal with noise level of your microphone, 300 is default. 
    #a higher enery threshold makes the recognized less sensitive to noise, so good in loud environments
    recognizer.dynamic_energy_threshold=True #automatically adjust to ambient noise
    with sr.Microphone() as source:
        print(prompt)
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source)

    try:
        text = recognizer.recognize_google(audio, language="en-US")
        print(f"You said: {text}")
        return text
    except sr.UnknownValueError:
        print("Sorry, I could not understand you.")
    except sr.RequestError as e:
        print(f"API error: {e}")
    return ""

import re
import requests
from datetime import date as dt_date

# This will only run when this voice_agent.py is run individually as main program.
if __name__ == "__main__":
    print("DeskHero Voice Agent Started! Say 'exit' to quit.")
    print("Example: 'Book seat 401 on floor 1 in building Agora for 2026-03-14'")
    
    while True:
        user_text = get_spoken_input("\nPlease speak now: ")
        
        if not user_text:
            continue
            
        text_lower = user_text.lower()
        if "exit" in text_lower or "quit" in text_lower:
            print("Goodbye!")
            break
            
        # Convert common written numbers to digits
        num_map = {
            "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
            "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
            "eleven": "11", "twelve": "12"
        }
        
        # Replace spoken words with digits to help regex
        for word, digit in num_map.items():
            text_lower = text_lower.replace(f" {word} ", f" {digit} ")
            if text_lower.endswith(f" {word}"):
                text_lower = text_lower[:-len(word)] + digit

        # Correct common speech-to-text mistakes for building names
        text_lower = text_lower.replace("building aura", "building agora")
        text_lower = text_lower.replace("building aggra", "building agora")
        text_lower = text_lower.replace("building a quarter", "building agora")
        
        # Very basic regex parser to extract reservation info
        seat_match = re.search(r'seat\s+(\d+)', text_lower)
        # Look for "floor X" or just "on X"
        floor_match = re.search(r'(?:floor|on)\s+(\d+)', text_lower)
        building_match = re.search(r'building\s+([a-zA-Z]+)', text_lower)
        # Handle dates like '2026-03-16' or '2026 03 16' or '2026 03:16'
        date_match = re.search(r'(\d{4})[-\s/]?(\d{2})[-\s/:]?(\d{2})', text_lower)
        
        if seat_match and floor_match and building_match:
            seat = int(seat_match.group(1))
            floor = int(floor_match.group(1))
            building = building_match.group(1).title() # Capitalize building name
            
            # Default to today if no date spoken
            res_date = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}" if date_match else dt_date.today().isoformat()
            
            print(f"\nUnderstood: Booking Seat {seat} on Floor {floor} at {building} for {res_date}...")
            
            # Send the request to the local FastAPI server
            payload = {
                "building": building,
                "floor": floor,
                "seat_number": seat,
                "date": res_date,
                "reserved_by": "Voice Agent"
            }
            
            try:
                response = requests.post("http://127.0.0.1:8000/api/v1/reservations", json=payload)
                if response.status_code == 201:
                    print("✅ Success! Your desk has been reserved.")
                    break  # Exit the script after a successful reservation
                else:
                    print(f"❌ Failed to reserve: {response.json().get('detail', 'Unknown error')}")
            except requests.exceptions.ConnectionError:
                print("❌ Cannot connect to the API. Is the Uvicorn server running?")
                
        else:
            print("I heard you, but I couldn't understand the reservation details.")
            print("Please make sure to say 'seat [number]', 'floor [number]', and 'building [name]'.")