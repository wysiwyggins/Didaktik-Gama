from kb import KMKKeyboard
from kmk.keys import KC
from kmk.modules.layers import Layers

keyboard = KMKKeyboard()

# Now that the keyboard object is defined, append the Layers module.
keyboard.modules.append(Layers())
_______ = KC.TRNS
XXXXXXX = KC.NO
keyboard.keymap = [
    [
        KC.B, KC.LALT(KC.B), KC.LALT(KC.C), KC.LALT(KC.D),
        KC.KP_7,   KC.KP_8,   KC.KP_9,   KC.C,
        KC.KP_4,   KC.KP_5,   KC.KP_6,   KC.LALT(KC.F),
        KC.P1,   KC.KP_2,   KC.KP_3,   KC.LALT(KC.O),
        _______, KC.LCTRL, XXXXXXX,   XXXXXXX,
        ]
]

if __name__ == '__main__':
    keyboard.go()
