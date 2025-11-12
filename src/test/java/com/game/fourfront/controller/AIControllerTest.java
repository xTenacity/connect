package com.game.fourfront.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AIController.class)
public class AIControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    public void testAIMoveEndpoint() throws Exception {
        String body = "{ \"board\": [" +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]," +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]," +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]," +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]," +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]," +
                "[\"_\",\"_\",\"_\",\"_\",\"_\",\"_\",\"_\"]]," +
                " \"aiPiece\": \"O\", \"aiDepth\": 3, \"mistakeRate\": 0.0, \"aiName\": \"test\" }";

        var resp = mvc.perform(post("/api/ai/move")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andReturn();

        String response = resp.getResponse().getContentAsString();
        assertThat(response).contains("move");
        // basic numeric check
        int idx = response.indexOf("move");
        assertThat(idx).isGreaterThanOrEqualTo(0);
    }
}

