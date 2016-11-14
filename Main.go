package main

import "net"

func main() {
	addr, error := net.ResolveUDPAddr("udp", ":9000")

	if error != nil {
		panic(error)
	}
	conn, err := net.ListenUDP("udp", addr)

	if err != nil {
		panic(err)
	}

}

func handleConnection(conn net.Conn) {

}
