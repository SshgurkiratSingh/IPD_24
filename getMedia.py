import dbus
import time
import paho.mqtt.client as mqtt


class MQTTClient:
    def __init__(self, broker="localhost", port=1883):
        """Initialize MQTT client"""
        self.client = mqtt.Client()
        self.broker = broker
        self.port = port
        self.current_player = None
        self.bus = dbus.SessionBus()

        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, rc):
        """Callback when client connects"""
        if rc == 0:
            print(f"Connected to MQTT broker at {self.broker}")
            # Subscribe to topic after connection
            self.client.subscribe("c/playbackcontrol")
        else:
            print(f"Connection failed with code: {rc}")

    def _on_message(self, client, userdata, msg):
        """Callback when message is received"""
        command = msg.payload.decode()
        print(f"Received command: {command} on topic: {msg.topic}")

        if msg.topic == "c/playbackcontrol":
            self.handle_playback_command(command)

    def handle_playback_command(self, command):
        """Handle playback control commands"""
        try:
            if not self.current_player:
                self.update_current_player()

            if not self.current_player:
                print("No active media player found")
                return

            player_interface = dbus.Interface(
                self.current_player,
                'org.mpris.MediaPlayer2.Player'
            )

            if command == "1":  # Play/Pause
                player_interface.PlayPause()
                print("Toggled Play/Pause")
            elif command == "2":  # Next
                player_interface.Next()
                print("Skipped to next track")
            elif command == "3":  # Previous
                player_interface.Previous()
                print("Skipped to previous track")
            else:
                print(f"Unknown command: {command}")

        except dbus.exceptions.DBusException as e:
            print(f"Error controlling playback: {e}")
            self.current_player = None

    def update_current_player(self):
        """Find and update the current active media player"""
        for service in self.bus.list_names():
            if service.startswith('org.mpris.MediaPlayer2.'):
                try:
                    self.current_player = self.bus.get_object(
                        service,
                        '/org/mpris/MediaPlayer2'
                    )
                    print(f"Found active player: {service}")
                    return
                except dbus.exceptions.DBusException:
                    continue

    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker, self.port)
            self.client.loop_start()
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def publish_data(self, data1: str, data2: str):
        """Publish data to two different topics"""
        try:
            self.client.publish("sensor/temp", data1)
            self.client.publish("sensor/humidity", data2)
            print(f"Published: Temperature={data1}, Humidity={data2}")
        except Exception as e:
            print(f"Publishing error: {e}")

    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()


def get_player_info():
    bus = dbus.SessionBus()
    last_title = None
    mqtt_client = mqtt.Client()  # Initialize MQTT client correctly
    mqtt_client.connect("localhost", 1883, 60)

    while True:
        for service in bus.list_names():
            if service.startswith('org.mpris.MediaPlayer2.'):
                player = bus.get_object(service, '/org/mpris/MediaPlayer2')

                try:
                    # Get player name from service string
                    player_name = service.split('org.mpris.MediaPlayer2.')[1]

                    metadata = player.Get(
                        'org.mpris.MediaPlayer2.Player',
                        'Metadata',
                        dbus_interface='org.freedesktop.DBus.Properties'
                    )

                    # Extract title and artist(s)
                    title = metadata.get('xesam:title', 'Unknown Title')
                    artists = metadata.get('xesam:artist', ['Unknown Artist'])
                    if isinstance(artists, dbus.Array):
                        artists = [str(artist) for artist in artists]
                    artist_string = ', '.join(artists)

                    # Only publish if title has changed
                    if title != last_title and len(title) >= 5:
                        print(f"Player: {player_name}")
                        print(f"Title: {title}")
                        print(f"Artist: {artists}")

                        # Corrected publish method call
                        mqtt_client.publish("c/Song", title)
                        mqtt_client.publish("c/Artist", artist_string)
                        last_title = title

                    break

                except dbus.exceptions.DBusException as e:
                    print(f"Error getting metadata from {service}: {e}")

        time.sleep(1)  # Wait 1 second before checking again


if __name__ == "__main__":
    get_player_info()
