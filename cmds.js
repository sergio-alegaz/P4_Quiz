const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const Sequelize = require('sequelize');

exports.helpCmd = (socket, rl) => {
	log(socket, "Comandos:");
	log(socket, "	h|help - Muestra esta ayuda.");
	log(socket, "	list - Listar los quizzes existentes.");
	log(socket, "	show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	log(socket, "	add - Añadir un nuevo quiz interactivamente.");
	log(socket, "	delete <id> - Borrar el quiz indicado.");
	log(socket, "	edit <id> - Editar el quiz indicado.");
	log(socket, "	test <id> - Probar el quiz indicado.");
	log(socket, "	p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log(socket, "	credits - Créditos.");
	log(socket, "	q|quit - Salir del programa.");
	rl.prompt();
};

const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.addCmd = (socket, rl) => {

	/*rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

		rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
	
			model.add(question, answer);
			log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});*/


	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca una respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
					log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

	}) 
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo');
		error.errors.forEach(({message}) => errorlog(socket, message)); 
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});

		
};

exports.listCmd = (socket, rl) => {
	
	/*model.getAll().forEach((quiz, id) => {
		log(`	[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});

	rl.prompt();*/



	models.quiz.findAll()
	.each(quiz => {
			log(socket, `	[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	})

};

const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === 'undefined') {
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número`));
			} else {
				resolve(id);
			}
		}
	});
};

exports.showCmd = (socket, rl, id) => {

	/*if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {		
		try {
			const quiz = model.getByIndex(id);
			log(`	[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch(error) {
			errorlog(error.message);
		}
	}

	rl.prompt();*/



	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
			log(socket, `	[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});


};

exports.testCmd = (socket, rl, id) => {

	/*if (typeof id === "undefined") {

		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else { 

		try {

		const quiz = model.getByIndex(id);

		rl.question(colorize(`${quiz.question} `, 'red'), respuesta => {
			
			if ((respuesta || "").toLowerCase().trim() === (quiz.answer || "").toLowerCase().trim()) {
				log(`Su respuesta es: correcta`);
				biglog('correcta', 'green');
				rl.prompt();
			} else {
				log(`Su respuesta es: incorrecta`);
				biglog('incorrecta', 'red');
				rl.prompt();
			}
		});

		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}*/

	//validar id
	//obtener pregunta de DDBB, como en edit
	//preguntar por la pregunta asociada al quiz recuperado

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {

		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}

		return makeQuestion(rl, colorize(`${quiz.question} `, 'magenta'))
		.then(a => {
			if ((a || "").toLowerCase().trim() === (quiz.answer || "").toLowerCase().trim()) {
				log(socket, `Su respuesta es: correcta`);
				biglog(socket, 'correcta', 'green');
			} else {
				log(socket, `Su respuesta es: incorrecta`);
				biglog(socket, 'incorrecta', 'red');
			}
		});
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});

};
			



		/* rl.question  quiz.question	resp => {
			if (respuesta === quiz.answer)	correcto/incorrecto

				prompt

		}

		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}	
	}
};*/

exports.playCmd = (socket, rl) => {
	
	/*let score = 0;
	let toBeResolved = []; //id de las preguntas sin responder	
	let i = 0;
	let length = 0;

	model.getAll().forEach(() => {
		length++;
	});

	for(i; i<length; i++) {
		toBeResolved.push(i);
	};

	const playOne = () => {

		if (toBeResolved.length === 0) {

			log(`No hay nada más que preguntar.`); 
			log(`Fin del examen. Aciertos:`);
			biglog(`${score}`, 'red'); //resultado por pantalla
			score = 0;
			rl.prompt();

		} else {

			let index1 = parseInt(Math.random()*(toBeResolved.length-1));
			let id = toBeResolved[index1];
			
			toBeResolved.splice(index1, 1);

			let quiz = model.getByIndex(id);

			rl.question(colorize(`${quiz.question}? `, 'red'), respuesta => {
			
				if ((respuesta || "").toLowerCase().trim() === (quiz.answer || "").toLowerCase().trim()) {				

					score++
					log(`CORRECTO - Lleva ${score} aciertos`);
					playOne();
				} else {
					log(`INCORRECTO`);
					log(`Fin del examen. Aciertos:`);
					biglog(`${score}`, 'red');
					score = 0;
					rl.prompt();
				}
			});
		}
	};

	playOne();*/ //llamada para la primera vez*/ 

	//cargar inicialmente en una array todas las preguntas disponible en la DDBB
	//eliminarlas segun se preguntan
	//promesas
	

	let score = 0;
	let toBeResolved = []; //id de las preguntas sin responder	
	let i = 1;
	let length = 0;

	models.quiz.findAll()
	.each(quiz => {
			length++;
	})
	.then(() => {
		for(i; i<=length; i++) {
			toBeResolved.push(i);
		};
	})
	.then(() => {

		const playOne = () => {

			if (toBeResolved.length === 0) {

				log(socket, `No hay nada más que preguntar.`); 
				log(socket, `\nFin del examen. Aciertos:`);
				biglog(socket, `${score}`, 'red'); //resultado por pantalla
				score = 0;
			} else {

				let index1 = parseInt(Math.random()*(toBeResolved.length-1));
				let id = toBeResolved[index1];
				
				toBeResolved.splice(index1, 1);

				validateId(id)
				.then(id => models.quiz.findById(id))
				.then(quiz => {

					/*if (!quiz) {
						throw new Error(`No existe un quiz asociado al id=${id}.`);
					}*/

					return makeQuestion(rl, quiz.question)
					.then(a => {
						if ((a || "").toLowerCase().trim() === (quiz.answer || "").toLowerCase().trim()) {
							score++
							log(socket, `\ncorrecto - Lleva ${score} Aciertos`);
							playOne();
						} else {
							/*log(`\nincorrecto`);
							log(`\nFin del examen. Aciertos:`); ----------------> con esto un 9/10*/
							log(socket, `\nincorrecto - fin del examen, aciertos:`)
							biglog(socket, `${score}`, 'red');
							score = 0;
						}
					})
					.then(() => {
						rl.prompt();
					})
				})
				.catch(error => {
					errorlog(socket, error.message);
				})
				/*.then(() => {
					rl.prompt();
				})*/;
			} //////
		}

		playOne();
	});


};

exports.deleteCmd = (socket, rl, id) => {

	/*if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {		
		try {
			model.deleteByIndex(id);			
		} catch(error) {
			errorlog(error.message);
		}
	}

	rl.prompt();*/


	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	})
};

exports.editCmd = (socket, rl, id) => {

	/*if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try {
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

		    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);


				rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {

				   model.update(id, question, answer);
				   log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
				   rl.prompt();
				});
		   });
		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}*/


	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, ' Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, ' Introduzca la respuesta')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
   		log(socket, ` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	})
};

exports.quitCmd = (socket, rl) => {
	rl.close();
	socket.end();
};

exports.creditsCmd = (socket, rl) => {
	log(socket, 'Autor de la práctica:');
	log(socket, 'Sergio Ávalos Legaz');
	rl.prompt();  		
};
