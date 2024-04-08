from kb import KMKKeyboard
from kmk.keys import KC
from kmk.modules.layers import Layers
from kmk.extensions.media_keys import MediaKeys

keyboard = KMKKeyboard()

media_keys = MediaKeys()
layers = Layers()

keyboard.extensions = [media_keys]
keyboard.modules = [layers]

# Define empty and transparent keys for convenience
_______ = KC.TRNS
XXXXXXX = KC.NO

# Base Layer: Standard keys, with the thumb key for toggling to the Ctrl layer
base_layer = [
    KC.A,    KC.B,    KC.C,    KC.D,
    KC.E,    KC.F,    KC.G,    KC.H,
    KC.I,    KC.J,    KC.K,    KC.L,
    KC.M,    KC.N,    KC.O,    KC.P,
    KC.Q,    KC.R,    KC.S,    KC.T,
    KC.TG(1),  # Thumb key toggles to the Ctrl layer
]

# Ctrl Layer: Custom functions or macros related to Ctrl mappings, thumb key toggles to the Alt layer
ctrl_layer = [
    KC.M(1), KC.M(2), KC.M(3), KC.M(4),  # Custom macros or functions
    KC.M(5), KC.M(6), KC.M(7), KC.M(8),
    KC.M(9), KC.M(10), KC.M(11), KC.M(12),
    KC.M(13), KC.M(14), KC.M(15), KC.M(16),
    KC.TG(2),  # Thumb key toggles to the Alt layer
]

# Alt Layer: Custom functions or macros related to Alt mappings, thumb key returns to Base layer
alt_layer = [
    KC.M(17), KC.M(18), KC.M(19), KC.M(20),  # Custom macros or functions
    KC.M(21), KC.M(22), KC.M(23), KC.M(24),
    KC.M(25), KC.M(26), KC.M(27), KC.M(28),
    KC.M(29), KC.M(30), KC.M(31), KC.M(32),
    KC.TG(0),  # Thumb key returns to the Base layer
]

# Assign layers to the keyboard
keyboard.keymap = [base_layer, ctrl_layer, alt_layer]

if __name__ == '__main__':
    keyboard.go()
