from kb import KMKKeyboard
from kmk.keys import KC

keyboard = KMKKeyboard()

# Assuming your keypad has 16 keys in total, but original layers defined fewer
keyboard.keymap = [
    [  
        KC.A, KC.B, KC.C, KC.D,
        KC.E, KC.F, KC.G, KC.MO(1),  # Momentarily switch to layer 1 while held
        KC.H, KC.I, KC.J, KC.K,
        KC.L, KC.M, KC.NO, KC.NO,
    ],
    [  
        KC.N1, KC.N2, KC.N3, KC.N4,
        KC.N5, KC.N6, KC.N7, KC.MO(0),  # This will not switch back to layer 0, just for symmetrical placement
        KC.N8, KC.N9, KC.NO, KC.NO,
        KC.NO, KC.NO, KC.NO, KC.NO,
    ],
]



if __name__ == '__main__':
    keyboard.go()
