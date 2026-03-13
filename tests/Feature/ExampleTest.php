<?php

it('redirects home to login for guests', function () {
    $response = $this->get('/');
    $response->assertRedirect('/login');
});
