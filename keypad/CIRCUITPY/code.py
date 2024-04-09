from kb import KMKKeyboard
from kmk.keys import KC

keyboard = KMKKeyboard()

# Assuming your keypad has 16 keys in total, but original layers defined fewer
keyboard.keymap = [
    [  
        KC.LALT(KC.A), KC.LALT(KC.B), KC.LALT(KC.C), KC.LALT(KC.D),
        KC.LALT(KC.E), KC.LALT(KC.F), KC.LALT(KC.G), KC.LALT(KC.H),  # Momentarily switch to layer 1 while held
        KC.LALT(KC.M), KC.LALT(KC.N), KC.LALT(KC.O), KC.LALT(KC.P),
        KC.LALT(KC.Q), KC.LALT(KC.R), KC.LALT(KC.S), KC.LALT(KC.T),
        KC.LOPTION, KC.MO(1), KC.MO(1), KC.MO(1),
    ],
    [  
        KC.LCTRL(KC.A), KC.LCTRL(KC.B), KC.LCTRL(KC.C), KC.LCTRL(KC.D),
        KC.LCTRL(KC.E), KC.LCTRL(KC.F), KC.LCTRL(KC.G), KC.LCTRL(KC.H),  # Momentarily switch to layer 1 while held
        KC.LCTRL(KC.M), KC.LCTRL(KC.N), KC.LCTRL(KC.O), KC.LCTRL(KC.P),
        KC.LCTRL(KC.Q), KC.LCTRL(KC.R), KC.LCTRL(KC.S), KC.LCTRL(KC.T),
        KC.LOPTION, KC.MO(2), KC.MO(2), KC.MO(2),
    ],
    [  
        KC.LCTRL(KC.1), KC.LCTRL(KC.2), KC.LCTRL(KC.3), KC.LCTRL(KC.4),
        KC.LCTRL(KC.5), KC.LCTRL(KC.6), KC.LCTRL(KC.7), KC.LCTRL(KC.8),  # Momentarily switch to layer 1 while held
        KC.LCTRL(KC.9), KC.LALT(KC.1), KC.LALT(KC.2), KC.LALT(KC.3),
        KC.LALT(KC.4), KC.LALT(KC.5), KC.LALT(KC.6), KC.LALT(KC.7),
        KC.LOPTION, KC.MO(0), KC.MO(0), KC.MO(0),
    ]
]



if __name__ == '__main__':
    keyboard.go()