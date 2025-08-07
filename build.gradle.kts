plugins {
    java
    war
    id("org.teavm") version "0.12.3"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.teavm:teavm-jso:0.12.3")
}

teavm {
    all {
        mainClass = "MainClass"
    }
    js {
        addedToWebApp = true
        targetFileName = "example.js"
    }
    wasmGC {
        addedToWebApp = true
        targetFileName = "example.wasm"
    }
}